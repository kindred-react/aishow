import type { LearningModule } from "@/data/types";

export const moduleJcrb6eModule: LearningModule = {
  id: "module-jcrb6e",
  name: "333",
  icon: "📚",
  order: 10,
  intro: "",
  knowledgeNodes: [],
  operationSteps: [],
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
