/**
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
  moduleEdits: Record<string, Partial<Pick<LearningModule, "name" | "icon" | "intro" | "enabledTabs">>>;
  lastUpdated?: string;
}

export const userContentStore: UserContentStore = {
  nodeEdits: {},
  addedNodes: {},
  deletedNodes: [],
  addedModules: [],
  deletedModules: [],
  moduleEdits: {},
};
