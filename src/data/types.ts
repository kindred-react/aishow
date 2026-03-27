export type KnowledgeLevel = "基础" | "进阶" | "实战";

export interface KnowledgeNode {
  id: string;
  title: string;
  level: KnowledgeLevel;
  metaphor: string;
  summary: string;
  points: string[];
  color: string;
  relatedOps: string[];
  dimensionTab?: string;  // 所属 Tab，不填则显示在默认 knowledge tab
  source?: string;
  updatedAt?: string;
  version?: number;
  imageUrl?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  scene: string;
  problem: string;
  solution: string;
  result: string;
  tags: string[];
  dimensionTab?: string;
  source?: string;
}

export interface OperationStep {
  id: string;
  title: string;
  target: string;
  detail: string;
  tools: string[];
  dimensionTab?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  dimension: string;
  level: 1 | 2 | 3 | 4 | 5;
  description: string;
  howTo: string[];
  dimensionTab?: string;
}

export interface LearningPathNode {
  id: string;
  title: string;
  level: KnowledgeLevel;
  prerequisite?: string[];
  estimatedHours?: number;
  tip?: string;
  dimensionTab?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: "初级" | "中级" | "高级";
  framework: string;
  keyPoints: string[];
  sampleAnswer: string;
  pitfall?: string;
  dimensionTab?: string;
}

export interface CareerMilestone {
  id: string;
  week: string;
  phase: string;
  goal: string;
  actions: string[];
  deliverable: string;
  resources?: string[];
  checkPoint: string;
  dimensionTab?: string;
}

export type DimensionTab = string; // built-in: "knowledge"|"operation"|"skills"|"path"|"interview"|"career"|"tools"|"cases" — or any custom key

export type TabWidget =
  | "knowledge"   // 知识点卡片
  | "operation"   // 操作步骤卡片
  | "case"        // 案例卡片
  | "skill"       // 能力雷达项
  | "path"        // 成长路径节点
  | "interview"   // 面试题
  | "career"      // 职业规划里程碑
  | "tool"        // 工具卡片
  | "compare";    // 对比组件

export interface TabConfig {
  key: DimensionTab;
  label: string;
  widgets?: TabWidget[]; // 该 tab 下允许新增的组件，不配置则按内置 tab 默认行为
}

export interface LearningModule {
  id: string;
  name: string;
  icon: string;
  order: number;
  intro: string;
  enabledTabs?: TabConfig[];  // 不配置则全部内置 tab 显示
  knowledgeNodes: KnowledgeNode[];
  operationSteps: OperationStep[];
  cases: CaseStudy[];
  skills?: SkillItem[];
  learningPath?: LearningPathNode[];
  interviewQuestions?: InterviewQuestion[];
  careerPlan?: CareerMilestone[];
  tools?: ToolItem[];
}

// ── Tool Item ─────────────────────────────────────────────────────────────

export interface ToolItem {
  id: string;
  name: string;
  category: string;
  url?: string;
  description: string;
  tags: string[];
  isPaid?: boolean;
  dimensionTab?: string;
}

// ── Compare Block ─────────────────────────────────────────────────────────

export interface CompareItem {
  id: string;
  name: string;       // 主标题，如「线性回归」
  nameEn?: string;    // 副标题/英文名
  color: string;      // CSS 颜色变量或 hex
  accent?: string;    // 背景色（rgba）
  tags: Record<string, string>; // 对比维度 key→value
  flow?: string[];              // 步骤流程
  keyPoints?: string[];         // 要点列表
}

export interface CompareBlock {
  id: string;
  moduleId: string;        // 所属模块
  dimensionTab: string;    // 所属 tab，如 "knowledge" | "operation" | ...
  title: string;           // 标题，如「六种算法横向对比」
  rows: { label: string; key: string }[]; // 表格行定义
  items: CompareItem[];
  order: number;
}

/**
 * 知识库合并规则（给 AI 分析 PPT/PDF 后写入时参考）：
 * 1. 完全重叠（标题+summary 高度相似）→ 跳过
 * 2. 补充性内容（同概念新角度）→ 追加到 points[]
 * 3. 更新性内容（数据/方法有变化）→ 更新 summary，version+1，更新 updatedAt
 * 4. 全新概念 → 新增 KnowledgeNode，source 写明来源文件
 */
