/**
 * GitHub API 工具：将用户编辑写入仓库的 userStore.ts 文件
 * 需要环境变量 NEXT_PUBLIC_GITHUB_TOKEN
 */

const REPO = "kindred-react/aishow";
const USER_STORE_PATH = "src/data/userStore.ts";
const BRANCH = "main";

import type { UserContentStore } from "@/data/userStore";

async function getFileSha(path: string, token: string): Promise<string | undefined> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) return undefined;
  const data = await res.json();
  return data.sha;
}

async function putFile(path: string, content: string, sha: string | undefined, token: string, message: string): Promise<{ ok: boolean; message: string }> {
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
  if (res.ok) return { ok: true, message: "已同步到 GitHub，约1-2分钟后部署生效" };
  const err = await res.json();
  return { ok: false, message: `GitHub API 错误: ${err.message}` };
}

export async function saveStoreToGitHub(store: UserContentStore): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, message: "未配置 GitHub Token，修改仅保存在本地" };

  try {
    const sha = await getFileSha(USER_STORE_PATH, token);
    const content = generateUserStoreFile(store);
    return await putFile(USER_STORE_PATH, content, sha, token,
      `chore: update userStore [${new Date().toLocaleString("zh-CN")}]`);
  } catch (e) {
    return { ok: false, message: `网络错误: ${String(e)}` };
  }
}

function generateUserStoreFile(store: UserContentStore): string {
  const json = JSON.stringify(store, null, 2);
  return `/**
 * userStore.ts
 * 用户对知识库的所有编辑，由网页编辑器通过 GitHub API 自动写入
 * 请勿手动修改此文件
 */
import type { KnowledgeNode, LearningModule } from "./types";

export interface UserContentStore {
  nodeEdits: Record<string, Partial<KnowledgeNode>>;
  addedNodes: Record<string, KnowledgeNode[]>;
  deletedNodes: string[];
  addedModules: LearningModule[];
  deletedModules: string[];
  moduleEdits: Record<string, Partial<Pick<LearningModule, "name" | "icon" | "intro">>>;
  lastUpdated?: string;
}

export const userContentStore: UserContentStore = ${json};
`;
}

// Legacy export kept for compatibility
export async function saveNotesToGitHub(notes: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: "请使用 saveStoreToGitHub" };
}
