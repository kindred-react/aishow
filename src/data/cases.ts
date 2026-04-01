export interface LifecycleDoc {
  id: string;
  name: string;
  icon: string;
  docsPath: string;
}

export interface LifecycleStage {
  id: string;
  name: string;
  icon: string;
  description: string;
  docs: LifecycleDoc[];
}

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: "01",
    name: "市场规划与调研",
    icon: "🔍",
    description: "了解目标用户及其痛点，分析市场机会与竞争格局",
    docs: [
      { id: "user-research", name: "用户研究报告", icon: "👥", docsPath: "/documents/01-市场规划与调研/用户研究报告.md" },
      { id: "market-analysis", name: "市场分析报告", icon: "📊", docsPath: "/documents/01-市场规划与调研/市场分析报告.md" },
      { id: "product-vision", name: "产品愿景文档", icon: "🎯", docsPath: "/documents/01-市场规划与调研/产品愿景文档.md" },
    ],
  },
  {
    id: "02",
    name: "需求分析与定义",
    icon: "📋",
    description: "将用户需求转化为具体功能需求，明确优先级和迭代计划",
    docs: [
      { id: "prd", name: "PRD产品需求文档", icon: "📄", docsPath: "/documents/02-需求分析与定义/PRD产品需求文档.md" },
      { id: "feature-list", name: "功能清单", icon: "✅", docsPath: "/documents/02-需求分析与定义/功能清单.md" },
      { id: "mvp", name: "MVP定义", icon: "🚀", docsPath: "/documents/02-需求分析与定义/MVP定义.md" },
    ],
  },
  {
    id: "03",
    name: "产品设计",
    icon: "🎨",
    description: "设计产品架构、交互流程和视觉规范",
    docs: [],
  },
  {
    id: "04",
    name: "原型验证",
    icon: "🖼️",
    description: "制作原型进行用户测试，验证需求假设",
    docs: [],
  },
  {
    id: "05",
    name: "技术开发",
    icon: "💻",
    description: "前后端开发、接口定义、数据库设计",
    docs: [],
  },
  {
    id: "06",
    name: "测试验收",
    icon: "🧪",
    description: "功能测试、性能测试、用户验收测试",
    docs: [],
  },
  {
    id: "07",
    name: "发布部署",
    icon: "🚀",
    description: "上线准备、灰度发布、监控告警",
    docs: [],
  },
  {
    id: "08",
    name: "运营迭代",
    icon: "📊",
    description: "数据监控、用户反馈、版本迭代",
    docs: [],
  },
];
