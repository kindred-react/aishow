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
  source?: string;    // 来源文件，如 "RAG精讲.pdf"
  updatedAt?: string; // 最后更新日期 ISO格式
  version?: number;   // 内容版本号，更新时递增
  imageUrl?: string;  // 配图路径（/public 相对路径）
}

export interface CaseStudy {
  id: string;
  title: string;
  scene: string;
  problem: string;
  solution: string;
  result: string;
  tags: string[];
  source?: string;
}

export interface OperationStep {
  id: string;
  title: string;
  target: string;
  detail: string;
  tools: string[];
}

export interface SkillItem {
  id: string;
  name: string;
  dimension: string;
  level: 1 | 2 | 3 | 4 | 5;
  description: string;
  howTo: string[];
}

export interface LearningPathNode {
  id: string;
  title: string;
  level: KnowledgeLevel;
  prerequisite?: string[];
  estimatedHours?: number;
  tip?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;       // 「技术理解」「产品设计」「商业判断」「行为面试」
  difficulty: "初级" | "中级" | "高级";
  framework: string;     // 答题框架，一句话
  keyPoints: string[];   // 核心答题要点
  sampleAnswer: string;  // 参考答案（简洁版）
  pitfall?: string;      // 常见坑
}

export interface CareerMilestone {
  id: string;
  week: string;          // 如「第1-2天」「第1周」
  phase: string;         // 阶段名称
  goal: string;          // 本阶段目标
  actions: string[];     // 具体行动清单
  deliverable: string;   // 可交付产物（证明你完成了）
  resources?: string[];  // 推荐资源
  checkPoint: string;    // 验收标准
}

export interface LearningModule {
  id: string;
  name: string;
  icon: string;
  order: number;
  intro: string;
  knowledgeNodes: KnowledgeNode[];
  operationSteps: OperationStep[];
  cases: CaseStudy[];
  skills?: SkillItem[];
  learningPath?: LearningPathNode[];
  interviewQuestions?: InterviewQuestion[];
  careerPlan?: CareerMilestone[];
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
  moduleId: string;   // 所属模块
  title: string;      // 标题，如「六种算法横向对比」
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
