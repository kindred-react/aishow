export interface AgentPattern {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  accent: string;
  imageUrl: string;
  complexity: string;
  iterative: string;
  roles: string;
  bestFor: string;
  notFor: string;
  flow: string[];
  keyPoints: string[];
}

export interface AgentPatternCompareRow {
  label: string;
  key: keyof Pick<AgentPattern, "complexity" | "iterative" | "roles" | "bestFor" | "notFor">;
}

export const agentPatterns: AgentPattern[] = [
  {
    id: "reflection",
    name: "反射模式",
    nameEn: "Reflection",
    color: "var(--c-pink)",
    accent: "rgba(255,128,191,0.12)",
    imageUrl: "/agent-patterns/reflection.png",
    complexity: "⭐ 低",
    iterative: "✅ 多轮迭代",
    roles: "LLM + 用户反馈",
    bestFor: "写作优化、代码审查",
    notFor: "实时性要求高的任务",
    flow: ["用户输入", "LLM初始输出", "用户反馈", "LLM反射修正", "迭代至满意", "返回结果"],
    keyPoints: [
      "核心是'反思'：LLM重新评估并调整自己的输出",
      "需要用户参与反馈，人在环路中",
      "与RLHF区别：反射是推理时行为，RLHF是训练时行为",
      "适合开放性、主观性强的任务",
    ],
  },
  {
    id: "tool-use",
    name: "工具使用模式",
    nameEn: "Tool Use",
    color: "var(--c-lime)",
    accent: "rgba(176,255,112,0.10)",
    imageUrl: "/agent-patterns/tool-use.png",
    complexity: "⭐⭐ 中",
    iterative: "❌ 单次调用",
    roles: "LLM + 工具/API + Vector DB",
    bestFor: "知识问答、实时数据查询",
    notFor: "无需外部信息的纯推理",
    flow: ["用户输入", "LLM判断需求", "调用工具/API", "获取外部数据", "生成响应", "返回结果"],
    keyPoints: [
      "工具存储在 vector 数据库，LLM按需检索调用",
      "解决知识截止和幻觉问题",
      "RAG 是工具使用模式的特例（检索工具）",
      "MCP 协议是标准化工具调用的实现方案",
    ],
  },
  {
    id: "react",
    name: "ReAct 模式",
    nameEn: "ReAct",
    color: "var(--c-neon)",
    accent: "rgba(99,243,255,0.10)",
    imageUrl: "/agent-patterns/react.png",
    complexity: "⭐⭐ 中",
    iterative: "✅ 思考-行动循环",
    roles: "推理LLM + 工具 + 生成LLM",
    bestFor: "需要推理+行动交替的任务",
    notFor: "简单单步任务",
    flow: ["用户查询", "推理LLM生成策略", "调用工具执行", "环境返回结果", "生成LLM解释输出", "返回响应"],
    keyPoints: [
      "双LLM架构：推理LLM负责策略，生成LLM负责输出",
      "Environment层负责工具执行与结果回传",
      "每步可追踪，失败可重试",
      "必须设最大步骤数防无限循环",
    ],
  },
  {
    id: "planning",
    name: "规划模式",
    nameEn: "Planning",
    color: "var(--c-orange)",
    accent: "rgba(255,180,84,0.10)",
    imageUrl: "/agent-patterns/planning.png",
    complexity: "⭐⭐⭐ 高",
    iterative: "✅ 任务序列编排",
    roles: "Planner + ReAct Agent",
    bestFor: "长流程自动化、多步骤研究",
    notFor: "单一短任务",
    flow: ["用户查询", "Planner分解任务", "生成任务序列", "ReAct Agent逐一执行", "结果回传Planner", "确认完成→综合响应"],
    keyPoints: [
      "双层架构：Planner（规划）+ ReAct Agent（执行）",
      "Planner监控所有子任务完成状态",
      "与多Agent区别：规划是串行任务编排，多Agent是并行专项分工",
      "适合复杂代码生成、多步骤调研任务",
    ],
  },
  {
    id: "multi-agent",
    name: "多智能体模式",
    nameEn: "Multi-Agent",
    color: "var(--c-violet)",
    accent: "rgba(158,141,255,0.10)",
    imageUrl: "/agent-patterns/multi-agent.png",
    complexity: "⭐⭐⭐ 高",
    iterative: "✅ 并行协作",
    roles: "PM Agent + 多专项Agent",
    bestFor: "复杂软件工程、跨领域协作",
    notFor: "简单单一领域任务",
    flow: ["用户查询", "PM Agent分配任务", "DevOps/TechLead/SDE执行", "各Agent回传结果", "PM Agent综合汇总", "返回最终响应"],
    keyPoints: [
      "典型层级：PM→DevOps→Tech Lead→SDE",
      "每级Agent完成后逐级回传，形成汇报链",
      "突破单Agent上下文瓶颈",
      "需定义Agent间通信协议和结果格式",
    ],
  },
];

export const agentPatternCompareRows: AgentPatternCompareRow[] = [
  { label: "复杂度",   key: "complexity" },
  { label: "迭代方式", key: "iterative" },
  { label: "核心角色", key: "roles" },
  { label: "最适合",   key: "bestFor" },
  { label: "不适合",   key: "notFor" },
];
