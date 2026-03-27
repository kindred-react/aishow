/**
 * GitHub Module Writer
 * 直接把修改后的节点数据写回对应的 src/data/modules/*.ts 文件
 */

const REPO = "kindred-react/aishow";
const BRANCH = "main";

import type { KnowledgeNode } from "@/data/types";

async function getFileShaAndContent(path: string, token: string): Promise<{ sha?: string; content?: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) return {};
  const data = await res.json();
  return {
    sha: data.sha,
    content: decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))))
  };
}

async function putFile(
  path: string,
  content: string,
  sha: string | undefined,
  token: string,
  message: string
): Promise<{ ok: boolean; message: string }> {
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, content: encoded, sha, branch: BRANCH }),
    }
  );
  if (res.ok) return { ok: true, message: "已写入 GitHub，约1-2分钟后部署生效" };
  const err = await res.json();
  return { ok: false, message: `GitHub 错误: ${err.message}` };
}

const MODULE_FILE_MAP: Record<string, string> = {
  foundations: "src/data/modules/foundations.ts",
  rag: "src/data/modules/rag.ts",
  finetune: "src/data/modules/finetune.ts",
  evaluation: "src/data/modules/evaluation.ts",
  deploy: "src/data/modules/deploy.ts",
  agent: "src/data/modules/agent.ts",
  emerging: "src/data/modules/emerging.ts",
  project: "src/data/modules/project.ts",
  aipm: "src/data/modules/aipm.ts",
};

export async function saveModuleNodesToGitHub(
  moduleId: string,
  nodes: KnowledgeNode[]
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, message: "未配置 GitHub Token" };

  const filePath = MODULE_FILE_MAP[moduleId];
  if (!filePath) return { ok: true, message: "新建模块暂不同步" };

  try {
    const { sha, content } = await getFileShaAndContent(filePath, token);
    if (!content) return { ok: false, message: "无法读取原始文件" };

    const newContent = replaceKnowledgeNodes(content, generateNodesTs(nodes));
    if (!newContent) return { ok: false, message: "文件格式无法解析" };

    return await putFile(
      filePath, newContent, sha, token,
      `feat: update knowledgeNodes in ${moduleId} [web editor]`
    );
  } catch (e) {
    return { ok: false, message: `错误: ${String(e)}` };
  }
}

function generateNodesTs(nodes: KnowledgeNode[]): string {
  return nodes.map(n => {
    const lines = [
      `      {`,
      `        id: ${JSON.stringify(n.id)},`,
      `        title: ${JSON.stringify(n.title)},`,
      `        level: ${JSON.stringify(n.level)},`,
      `        metaphor: ${JSON.stringify(n.metaphor)},`,
      `        summary: ${JSON.stringify(n.summary)},`,
      `        points: [`,
      ...n.points.map(p => `          ${JSON.stringify(p)},`),
      `        ],`,
      `        color: ${JSON.stringify(n.color)},`,
      `        relatedOps: [${(n.relatedOps ?? []).map(r => JSON.stringify(r)).join(", ")}],`,
    ];
    if (n.source) lines.push(`        source: ${JSON.stringify(n.source)},`);
    if (n.imageUrl) lines.push(`        imageUrl: ${JSON.stringify(n.imageUrl)},`);
    if (n.updatedAt) lines.push(`        updatedAt: ${JSON.stringify(n.updatedAt)},`);
    if (n.version !== undefined) lines.push(`        version: ${n.version},`);
    lines.push(`      },`);
    return lines.join("\n");
  }).join("\n");
}

function replaceKnowledgeNodes(fileContent: string, nodesTs: string): string | null {
  const start = fileContent.indexOf("knowledgeNodes: [");
  if (start === -1) return null;
  const bracketStart = fileContent.indexOf("[", start);
  let depth = 0;
  let end = bracketStart;
  for (let i = bracketStart; i < fileContent.length; i++) {
    if (fileContent[i] === "[") depth++;
    else if (fileContent[i] === "]") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  const before = fileContent.slice(0, bracketStart + 1);
  const after = fileContent.slice(end);
  return `${before}\n${nodesTs}\n    ${after}`;
}

// Legacy compat
export async function saveNotesToGitHub(_notes: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: "请使用 saveModuleNodesToGitHub" };
}
export async function saveStoreToGitHub(_store: unknown): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: "请使用 saveModuleNodesToGitHub" };
}
