/**
 * GitHub Module Writer
 * 把完整的 LearningModule 数据写回对应的 src/data/modules/*.ts 文件
 * 支持所有 tab：knowledgeNodes / operationSteps / cases / skills /
 *             learningPath / interviewQuestions / careerPlan / tools
 */

const REPO = "kindred-react/aishow";
const BRANCH = "main";

import type { LearningModule } from "@/data/types";
import type { CompareBlock } from "@/data/types";

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
  // Note: aipm100q is a standalone InterviewQuestion[] file, NOT a LearningModule.
  // Do NOT add it here — it is not managed by the web editor.
};

/** Derive file path for a module — builtin uses the map, new modules get a dynamic path */
function moduleFilePath(moduleId: string): string {
  return MODULE_FILE_MAP[moduleId] ?? `src/data/modules/${moduleId}.ts`;
}

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

/**
 * Generate the src/data/knowledge.ts index file content
 * based on the current full list of modules (after adds/deletes).
 */
function generateKnowledgeIndexTs(allModules: LearningModule[]): string {
  // Sort by order for stable output
  const sorted = [...allModules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const imports = sorted.map(m => {
    const exportName = `${m.id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Module`;
    const filePath = `./modules/${m.id}`;
    return `import { ${exportName} } from "${filePath}";`;
  }).join("\n");

  const moduleList = sorted.map(m => {
    const exportName = `${m.id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Module`;
    return `  ${exportName},`;
  }).join("\n");

  return [
    `import type { LearningModule } from "./types";`,
    imports,
    ``,
    `export type { KnowledgeLevel, KnowledgeNode, CaseStudy, OperationStep, LearningModule } from "./types";`,
    ``,
    `export const learningModules: LearningModule[] = [`,
    moduleList,
    `];`,
    ``,
  ].join("\n");
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Push a single module's full data to GitHub.
 * For new modules (not in MODULE_FILE_MAP), dynamically generates the file path.
 * Returns { ok, message } for UI feedback.
 */
export async function saveModuleToGitHub(
  module: LearningModule
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, message: "未配置 GitHub Token" };

  const filePath = moduleFilePath(module.id);
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

/**
 * Push the knowledge.ts index file to GitHub.
 * Must be called whenever modules are added or deleted.
 * allModules: the full current module list (after adds/deletes applied).
 */
export async function pushKnowledgeIndexToGitHub(
  allModules: LearningModule[]
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, message: "未配置 GitHub Token" };

  const filePath = "src/data/knowledge.ts";
  try {
    const sha = await getFileSha(filePath, token);
    const content = generateKnowledgeIndexTs(allModules);
    return await putFile(
      filePath, content, sha, token,
      "feat: update knowledge index [web editor]"
    );
  } catch (e) {
    return { ok: false, message: `错误: ${String(e)}` };
  }
}

// ── Compare Blocks ────────────────────────────────────────────────────────

function generateCompareBlocksTs(blocks: CompareBlock[]): string {
  return [
    `import type { CompareBlock } from "@/data/types";`,
    ``,
    `// 此文件由 Web 编辑器自动生成，请勿手动修改`,
    `export const compareBlocks: CompareBlock[] = ${serialize(blocks, 0)};`,
    ``,
  ].join("\n");
}

/**
 * Push all compare blocks to GitHub as src/data/compareBlocks.ts
 */
export async function pushCompareBlocksToGitHub(
  blocks: CompareBlock[]
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, message: "未配置 GitHub Token" };

  const filePath = "src/data/compareBlocks.ts";
  try {
    const sha = await getFileSha(filePath, token);
    const content = generateCompareBlocksTs(blocks);
    return await putFile(
      filePath, content, sha, token,
      "feat: update compareBlocks [web editor]"
    );
  } catch (e) {
    return { ok: false, message: `错误: ${String(e)}` };
  }
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
