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
  moduleEdits: Record<string, Partial<Pick<LearningModule, "name" | "icon" | "intro">>>;
  lastUpdated?: string;
}

export const userContentStore: UserContentStore = {
  "nodeEdits": {
    "aipm-classification": {
      "id": "aipm-classification",
      "title": "AI产品经理的分类：狭义 vs 广义",
      "summary": "狭义AI PM直接应用语义/语音/CV/ML四大技术，催生新产品形态和交互方式；广义AI PM间接涉及这四类技术。未来两者将融合。",
      "level": "基础",
      "metaphor": "是AI的主角还是配角",
      "points": [
        "狭义：对话PM、ASR/TTS PM、人脸识别PM、推荐算法PM、实体机器人PM等",
        "广义：未直接应用AI技术的终端PM、策略PM、脑机接口/量子计算等超前领域PM",
        "狭义特征：近几年才商用、有新产品形态、新交互方式、催生新职位",
        "广义特征：很可能2015年前就存在、由技术人员兼任、承担较多项目管理职责",
        "1"
      ],
      "color": "var(--c-lime)",
      "relatedOps": [],
      "source": "AI产品经理入门手册（上）.pdf",
      "updatedAt": "2026-03-27",
      "version": 2
    }
  },
  "addedNodes": {},
  "deletedNodes": [],
  "addedModules": [],
  "deletedModules": [],
  "moduleEdits": {},
  "lastUpdated": "2026-03-27T09:01:54.236Z"
};
