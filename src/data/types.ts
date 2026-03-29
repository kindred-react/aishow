export type KnowledgeLevel = "基础" | "进阶" | "实战";
export const KNOWLEDGE_LEVELS: KnowledgeLevel[] = ["基础", "进阶", "实战"];
export const KNOWLEDGE_LEVEL_DEFAULT: KnowledgeLevel = "基础";

export type InterviewDifficulty = "初级" | "中级" | "高级";
export const INTERVIEW_DIFFICULTIES: InterviewDifficulty[] = ["初级", "中级", "高级"];
export const INTERVIEW_DIFFICULTY_DEFAULT: InterviewDifficulty = "初级";

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

export const TAB_WIDGET = {
  Knowledge:  "knowledge",
  Operation:  "operation",
  Case:       "case",
  Cases:      "cases",
  Skill:      "skill",
  Skills:     "skills",
  Path:       "path",
  Interview:  "interview",
  Career:     "career",
  Tool:       "tool",
  Tools:      "tools",
  Compare:    "compare",
} as const;

export type TabWidget = typeof TAB_WIDGET[keyof typeof TAB_WIDGET];

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
 * widget key → LearningModule 字段的映射表。
 * 集中管理所有 widget 与模块数据的对应关系，避免组件里散落硬编码。
 *
 * field        — LearningModule 上的字段名
 * defaultTab   — 未设置 dimensionTab 时的默认 tab key
 * titleFn      — 从数据项取标题
 * subtitleFn   — 从数据项取副标题（可选）
 * searchFn     — 判断数据项是否匹配搜索词
 * typeLabel    — 搜索结果里显示的类型标签
 */
export const WIDGET_MODULE_MAP = [
  {
    widget: TAB_WIDGET.Knowledge,
    i18nKey: "widgetKnowledge",
    separateStore: true, // knowledge nodes use dedicated nodeEdits/addedNodes/deletedNodes
    desc: "Concept cards with metaphors, points, colors",
    field: "knowledgeNodes" as keyof LearningModule,
    defaultTab: "knowledge",
    typeLabel: "知识",
    titleFn:    (i: KnowledgeNode) => i.title,
    subtitleFn: (i: KnowledgeNode) => i.summary?.slice(0, 80),
    searchFn:   (i: KnowledgeNode, q: string) =>
      i.title.toLowerCase().includes(q) ||
      i.summary?.toLowerCase().includes(q) ||
      i.points?.some((p: string) => p.toLowerCase().includes(q)),
  },
  {
    widget: TAB_WIDGET.Operation,
    separateStore: false,
    i18nKey: "widgetOperation",
    desc: "Step-by-step instructions with tools",
    field: "operationSteps" as keyof LearningModule,
    defaultTab: "operation",
    typeLabel: "操作",
    titleFn:    (i: OperationStep) => i.title,
    subtitleFn: (i: OperationStep) => i.target,
    searchFn:   (i: OperationStep, q: string) =>
      i.title.toLowerCase().includes(q) ||
      i.detail?.toLowerCase().includes(q) ||
      i.target?.toLowerCase().includes(q) ||
      i.tools?.some((t: string) => t.toLowerCase().includes(q)),
  },
  {
    widget: TAB_WIDGET.Case,
    separateStore: false,
    i18nKey: "widgetCase",
    desc: "Scene-Problem-Solution-Result",
    field: "cases" as keyof LearningModule,
    defaultTab: "cases",
    typeLabel: "案例",
    titleFn:    (i: CaseStudy) => i.title,
    subtitleFn: (i: CaseStudy) => i.scene,
    searchFn:   (i: CaseStudy, q: string) =>
      i.title.toLowerCase().includes(q) ||
      i.scene?.toLowerCase().includes(q) ||
      i.problem?.toLowerCase().includes(q) ||
      i.solution?.toLowerCase().includes(q),
  },
  {
    widget: TAB_WIDGET.Tool,
    separateStore: false,
    i18nKey: "widgetTool",
    desc: "Tool name, category, link",
    field: "tools" as keyof LearningModule,
    defaultTab: "tools",
    typeLabel: "工具",
    titleFn:    (i: ToolItem) => i.name,
    subtitleFn: (i: ToolItem) => i.description,
    searchFn:   (i: ToolItem, q: string) =>
      i.name.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.tags?.some((tag: string) => tag.toLowerCase().includes(q)) ||
      i.category?.toLowerCase().includes(q),
  },
  {
    widget: TAB_WIDGET.Skill,
    separateStore: false,
    i18nKey: "widgetSkill",
    desc: "Skill dimensions and growth paths",
    field: "skills" as keyof LearningModule,
    defaultTab: "skills",
    typeLabel: "能力",
    titleFn:    (i: SkillItem) => i.name,
    subtitleFn: (i: SkillItem) => i.description,
    searchFn:   (i: SkillItem, q: string) =>
      i.name.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.dimension?.toLowerCase().includes(q) ||
      i.howTo?.some((h: string) => h.toLowerCase().includes(q)),
  },
  {
    widget: TAB_WIDGET.Interview,
    separateStore: false,
    i18nKey: "widgetInterview",
    desc: "Questions, frameworks, key points, sample answers",
    field: "interviewQuestions" as keyof LearningModule,
    defaultTab: "interview",
    typeLabel: "面试",
    titleFn:    (i: InterviewQuestion) => i.question.slice(0, 80),
    subtitleFn: (i: InterviewQuestion) => i.category,
    searchFn:   (i: InterviewQuestion, q: string) =>
      i.question.toLowerCase().includes(q) ||
      i.sampleAnswer?.toLowerCase().includes(q) ||
      i.keyPoints?.some((kp: string) => kp.toLowerCase().includes(q)) ||
      i.framework?.toLowerCase().includes(q),
  },
  {
    widget: TAB_WIDGET.Path,
    separateStore: false,
    i18nKey: "widgetPath",
    desc: "Prerequisites, duration, tips",
    field: "learningPath" as keyof LearningModule,
    defaultTab: "path",
    typeLabel: "路径",
    titleFn:    (i: LearningPathNode) => i.title,
    subtitleFn: (i: LearningPathNode) => i.tip,
    searchFn:   (i: LearningPathNode, q: string) =>
      i.title.toLowerCase().includes(q) ||
      i.tip?.toLowerCase().includes(q),
  },
  {
    widget: TAB_WIDGET.Career,
    separateStore: false,
    i18nKey: "widgetCareer",
    desc: "Phase, actions, deliverables",
    field: "careerPlan" as keyof LearningModule,
    defaultTab: "career",
    typeLabel: "职规",
    titleFn:    (i: CareerMilestone) => i.phase,
    subtitleFn: (i: CareerMilestone) => i.goal,
    searchFn:   (i: CareerMilestone, q: string) =>
      i.phase.toLowerCase().includes(q) ||
      i.goal?.toLowerCase().includes(q) ||
      i.actions?.some((a: string) => a.toLowerCase().includes(q)),
  },
] as const;

/**
 * Derived map: LearningModule field name → its default dimensionTab value.
 * Use as fallback: `item.dimensionTab ?? FIELD_DEFAULT_TAB["knowledgeNodes"]`
 * Avoids hardcoding defaultTab strings in components.
 */
export const FIELD_DEFAULT_TAB: Record<string, string> = Object.fromEntries(
  WIDGET_MODULE_MAP.map(e => [e.field, e.defaultTab])
);

/**
 * Derived map: defaultTab value → typeLabel (display name).
 * Use for tab headers and labels instead of hardcoding strings.
 */
export const TAB_LABEL_MAP: Record<string, string> = Object.fromEntries(
  WIDGET_MODULE_MAP.map(e => [e.defaultTab, e.typeLabel])
);

/**
 * 知识库合并规则（给 AI 分析 PPT/PDF 后写入时参考）：
 * 1. 完全重叠（标题+summary 高度相似）→ 跳过
 * 2. 补充性内容（同概念新角度）→ 追加到 points[]
 * 3. 更新性内容（数据/方法有变化）→ 更新 summary，version+1，更新 updatedAt
 * 4. 全新概念 → 新增 KnowledgeNode，source 写明来源文件
 */
