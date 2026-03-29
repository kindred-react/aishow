/**
 * GitHub Module Writer
 * 把完整的 LearningModule 数据写回对应的 src/data/modules/*.ts 文件
 * 支持所有 tab：knowledgeNodes / operationSteps / cases / skills /
 *             learningPath / interviewQuestions / careerPlan / tools
 *
 * 使用 Git Tree API 将所有文件改动合并为一个 commit，避免多个独立 commit。
 */

const REPO = "kindred-react/aishow";
const BRANCH = "main";

import type { LearningModule } from "@/data/types";
import type { CompareBlock } from "@/data/types";

// ── GitHub Git Tree API helpers ───────────────────────────────────────────

type TreeEntry = { path: string; mode: "100644"; type: "blob"; content: string };

async function getHeadCommitSha(token: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/git/ref/heads/${BRANCH}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`Failed to get HEAD: ${res.status}`);
  const data = await res.json();
  return data.object.sha as string;
}

async function getBaseTreeSha(commitSha: string, token: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/git/commits/${commitSha}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`Failed to get commit: ${res.status}`);
  const data = await res.json();
  return data.tree.sha as string;
}

async function createTree(baseTreeSha: string, entries: TreeEntry[], token: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/git/trees`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({ base_tree: baseTreeSha, tree: entries }),
    }
  );
  if (!res.ok) { const e = await res.json(); throw new Error(`Failed to create tree: ${e.message}`); }
  const data = await res.json();
  return data.sha as string;
}

async function createCommit(message: string, treeSha: string, parentSha: string, token: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/git/commits`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] }),
    }
  );
  if (!res.ok) { const e = await res.json(); throw new Error(`Failed to create commit: ${e.message}`); }
  const data = await res.json();
  return data.sha as string;
}

async function updateRef(commitSha: string, token: string): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/git/refs/heads/${BRANCH}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({ sha: commitSha }),
    }
  );
  if (!res.ok) { const e = await res.json(); throw new Error(`Failed to update ref: ${e.message}`); }
}

/**
 * Push multiple files as a single Git commit.
 * entries: array of { path, content } — all files to write.
 * message: commit message.
 */
async function pushBatchCommit(
  entries: { path: string; content: string }[],
  message: string,
  token: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const headSha = await getHeadCommitSha(token);
    const baseTreeSha = await getBaseTreeSha(headSha, token);
    const treeEntries: TreeEntry[] = entries.map(e => ({
      path: e.path,
      mode: "100644",
      type: "blob",
      content: e.content,
    }));
    const newTreeSha = await createTree(baseTreeSha, treeEntries, token);
    const newCommitSha = await createCommit(message, newTreeSha, headSha, token);
    await updateRef(newCommitSha, token);
    return { ok: true, message: `已推送 ${entries.length} 个文件到 GitHub，约1-2分钟后部署生效` };
  } catch (e) {
    return { ok: false, message: `GitHub 错误: ${String(e)}` };
  }
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

/** Generate file entries for changed modules (no network call). */
export function buildModuleEntries(
  changedModuleIds: string[],
  allModules: LearningModule[]
): { path: string; content: string; label: string }[] {
  return allModules
    .filter(m => changedModuleIds.includes(m.id))
    .map(m => ({
      path: moduleFilePath(m.id),
      content: generateModuleTs(m),
      label: m.name ?? m.id,
    }));
}

/** Generate file entry for the knowledge index. */
export function buildIndexEntry(allModules: LearningModule[]): { path: string; content: string; label: string } {
  return {
    path: "src/data/knowledge.ts",
    content: generateKnowledgeIndexTs(allModules),
    label: "知识库索引",
  };
}

/** Generate file entry for compare blocks. */
export function buildCompareEntry(blocks: CompareBlock[]): { path: string; content: string; label: string } {
  return {
    path: "src/data/compareBlocks.ts",
    content: generateCompareBlocksTs(blocks),
    label: "对比组件",
  };
}

/**
 * Push all changes as a single Git commit using the Git Tree API.
 * entries: array of { path, content, label } — all files to write.
 */
export async function pushAllChangesAsOneCommit(
  entries: { path: string; content: string; label: string }[],
  commitMessage: string
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, message: "未配置 GitHub Token（NEXT_PUBLIC_GITHUB_TOKEN）" };
  if (entries.length === 0) return { ok: true, message: "无需同步" };
  return pushBatchCommit(entries, commitMessage, token);
}

/**
 * Push all changed modules to GitHub (legacy: each module = one commit).
 * @deprecated Use pushAllChangesAsOneCommit instead.
 */
export async function pushChangesToGitHub(
  changedModuleIds: string[],
  allModules: LearningModule[]
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, message: "未配置 GitHub Token（NEXT_PUBLIC_GITHUB_TOKEN）" };
  const entries = buildModuleEntries(changedModuleIds, allModules);
  if (entries.length === 0) return { ok: true, message: "无需同步" };
  return pushBatchCommit(entries, `feat: update modules [web editor]`, token);
}

/**
 * Push the knowledge.ts index file to GitHub.
 * @deprecated Use pushAllChangesAsOneCommit instead.
 */
export async function pushKnowledgeIndexToGitHub(
  allModules: LearningModule[]
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, message: "未配置 GitHub Token" };
  const entry = buildIndexEntry(allModules);
  return pushBatchCommit([entry], "feat: update knowledge index [web editor]", token);
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
 * @deprecated Use pushAllChangesAsOneCommit instead.
 */
export async function pushCompareBlocksToGitHub(
  blocks: CompareBlock[]
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, message: "未配置 GitHub Token" };
  const entry = buildCompareEntry(blocks);
  return pushBatchCommit([entry], "feat: update compareBlocks [web editor]", token);
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
