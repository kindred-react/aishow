import type { LearningModule } from "@/data/types";

export const moduleWpacrbModule: LearningModule = {
  id: "module-wpacrb",
  name: "测",
  icon: "📚",
  order: 10,
  intro: "",
  knowledgeNodes: [
    {
      id: "node-k56xcs",
      title: "11212",
      summary: "",
      level: "基础",
      metaphor: "",
      points: [],
      color: "var(--c-neon)",
      relatedOps: [],
      updatedAt: "2026-03-29",
      version: 1,
      imageUrl: "/uploads/module-wpacrb-knowledge/img-1774785096119-tpe1.jpg",
      dimensionTab: "knowledge",
    },
  ],
  operationSteps: [
    {
      id: "op-m3jwpi",
      title: "23",
      tools: [],
      dimensionTab: "operation",
    },
  ],
  cases: [],
  enabledTabs: [
    {
      key: "knowledge",
      label: "知识",
      widgets: ["knowledge", "compare"],
    },
    {
      key: "operation",
      label: "操作",
      widgets: ["operation", "compare"],
    },
    {
      key: "cases",
      label: "案例",
      widgets: ["case", "compare"],
    },
    {
      key: "tools",
      label: "工具",
      widgets: ["tool", "compare"],
    },
    {
      key: "skills",
      label: "能力",
      widgets: ["skill", "compare"],
    },
    {
      key: "interview",
      label: "面试",
      widgets: ["interview", "compare"],
    },
    {
      key: "path",
      label: "路径",
      widgets: ["path", "compare"],
    },
    {
      key: "career",
      label: "职规",
      widgets: ["career", "compare"],
    },
  ],
};
