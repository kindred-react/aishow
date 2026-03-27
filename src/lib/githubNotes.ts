/**
 * GitHub Module Writer
 * 把完整的 LearningModule 数据写回对应的 src/data/modules/*.ts 文件
 * 支持所有 tab：knowledgeNodes / operationSteps / cases / skills /
 *             learningPath / interviewQuestions / careerPlan / tools
 */

const REPO = "kindred-react/aishow";
const BRANCH = "main";

import type { LearningModule } from "@/data/types";

// ── GitHub helpers ────────────────────────────────────────────────────────

async function getFileSha(path: string, token: string): Promise<string | undefined> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) return undefined;
  const data = await res.json();
  return data.sha as string;
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

// ── Module file map ───────────────────────────────────────────────────────

const MODULE_FILE_MAP: Record<string, string> = {
  foundations: "src/data/modules/foundations.ts",
  rag:         "src/data/modules/rag.ts",
  finetune:    "src/data/modules/finetune.ts",
  evaluation:  "src/data/modules/evaluation.ts",
  deploy:      "src/data/modules/deploy.ts",
  agent:       "src/data/modules/agent.ts",
  emerging:    "src/data/modules/emerging.ts",
  project:     "src/data/modules/project.ts",
  aipm:        "src/data/modules/aipm.ts",
  aipm100q:    "src/data/modules/aipm100q.ts",
};

// ── TypeScript serializer ─────────────────────────────────────────────────
// Converts a value to a TypeScript literal string (subset of JSON-compatible types).

function serialize(val: unknown, indent: number): string {
  const pad = " ".repeat(indent);
  const pad1 = " ".repeat(indent + 2);

  if (val === null || val === undefined) return "undefined";
  if (typeof val === "boolean") return String(val);
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return JSON.stringify(val);

  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    // flat array of primitives → single line
    if (val.every(v => typeof v !== "object" || v === null)) {
      return `[${val.map(v => serialize(v, 0)).join(", ")}]`;
    }
    const items = val.map(v => `${pad1}${serialize(v, indent + 2)},`).join("\n");
    return `[\n${items}\n${pad}]`;
  }

  if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${pad1}${k}: ${serialize(v, indent + 2)},`);
    if (entries.length === 0) return "{}";
    return `{\n${entries.join("\n")}\n${pad}}`;
  }

  return JSON.stringify(val);
}

function generateModuleTs(module: LearningModule): string {
  const exportName = `${module.id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Module`;

  // Build fields — only include optional arrays when non-empty
  const fields: string[] = [
    `  id: ${JSON.stringify(module.id)},`,
    `  name: ${JSON.stringify(module.name)},`,
    `  icon: ${JSON.stringify(module.icon)},`,
    `  order: ${module.order},`,
    `  intro: ${JSON.stringify(module.intro)},`,
    `  knowledgeNodes: ${serialize(module.knowledgeNodes, 2)},`,
    `  operationSteps: ${serialize(module.operationSteps, 2)},`,
    `  cases: ${serialize(module.cases, 2)},`,
  ];

  if (module.skills && module.skills.length > 0)
    fields.push(`  skills: ${serialize(module.skills, 2)},`);
  if (module.learningPath && module.learningPath.length > 0)
    fields.push(`  learningPath: ${serialize(module.learningPath, 2)},`);
  if (module.interviewQuestions && module.interviewQuestions.length > 0)
    fields.push(`  interviewQuestions: ${serialize(module.interviewQuestions, 2)},`);
  if (module.careerPlan && module.careerPlan.length > 0)
    fields.push(`  careerPlan: ${serialize(module.careerPlan, 2)},`);
  if (module.tools && module.tools.length > 0)
    fields.push(`  tools: ${serialize(module.tools, 2)},`);
  if (module.enabledTabs && module.enabledTabs.length > 0)
    fields.push(`  enabledTabs: ${serialize(module.enabledTabs, 2)},`);

  return [
    `import type { LearningModule } from "@/data/types";`,
    ``,
    `export const ${exportName}: LearningModule = {`,
    ...fields,
    `};`,
    ``,
  ].join("\n");
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Push a single module's full data to GitHub.
 * Returns { ok, message } for UI feedback.
 */
export async function saveModuleToGitHub(
  module: LearningModule
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, message: "未配置 GitHub Token" };

  const filePath = MODULE_FILE_MAP[module.id];
  if (!filePath) return { ok: true, message: `模块 ${module.id} 为新建模块，暂不同步` };

  try {
    const sha = await getFileSha(filePath, token);
    const content = generateModuleTs(module);
    return await putFile(
      filePath, content, sha, token,
      `feat: update ${module.id} [web editor]`
    );
  } catch (e) {
    return { ok: false, message: `错误: ${String(e)}` };
  }
}

/**
 * Push all changed modules to GitHub in parallel.
 * changedModuleIds: list of module IDs that were edited.
 * allModules: the full merged module list to get current data from.
 */
export async function pushChangesToGitHub(
  changedModuleIds: string[],
  allModules: LearningModule[]
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, message: "未配置 GitHub Token（NEXT_PUBLIC_GITHUB_TOKEN）" };

  const targets = allModules.filter(m => changedModuleIds.includes(m.id));
  if (targets.length === 0) return { ok: true, message: "无需同步" };

  const results = await Promise.all(targets.map(m => saveModuleToGitHub(m)));
  const failed = results.filter(r => !r.ok);

  if (failed.length === 0) {
    return { ok: true, message: `已推送 ${targets.length} 个模块到 GitHub，约1-2分钟后部署生效` };
  }
  return { ok: false, message: failed.map(r => r.message).join("；") };
}

// ── Legacy compat ─────────────────────────────────────────────────────────
export async function saveModuleNodesToGitHub(): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: "请使用 saveModuleToGitHub" };
}
export async function saveNotesToGitHub(): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: "已废弃" };
}
export async function saveStoreToGitHub(): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: "已废弃" };
}
