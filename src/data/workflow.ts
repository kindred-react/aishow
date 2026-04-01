export type Role = "pm" | "pmo" | "architect" | "developer" | "designer" | "ux_researcher" | "tester" | "ops" | "analyst" | "stakeholder" | "executive";

export interface RoleInfo {
  id: Role;
  name: string;
  icon: string;
  color: string;
}

export const ROLES: RoleInfo[] = [
  { id: "pm", name: "产品经理", icon: "📋", color: "#6366f1" },
  { id: "pmo", name: "项目经理", icon: "📊", color: "#06b6d4" },
  { id: "architect", name: "架构师", icon: "🏗️", color: "#ec4899" },
  { id: "developer", name: "开发工程师", icon: "💻", color: "#22c55e" },
  { id: "designer", name: "设计师", icon: "🎨", color: "#f59e0b" },
  { id: "ux_researcher", name: "用户研究员", icon: "🔍", color: "#14b8a6" },
  { id: "tester", name: "测试工程师", icon: "🧪", color: "#ef4444" },
  { id: "ops", name: "运维/DevOps", icon: "⚙️", color: "#8b5cf6" },
  { id: "analyst", name: "数据分析师", icon: "📈", color: "#f97316" },
  { id: "stakeholder", name: "业务方", icon: "👔", color: "#64748b" },
  { id: "executive", name: "高管/决策者", icon: "🎯", color: "#c026d3" },
];

export interface LifecycleNode {
  id: string;
  phase: string;
  phaseNum: number;
  description: string;
}

export const LIFECYCLE_NODES: LifecycleNode[] = [
  { id: "planning", phase: "市场规划与调研", phaseNum: 1, description: "市场分析、竞品调研、用户需求收集与产品定位" },
  { id: "requirements", phase: "需求分析与定义", phaseNum: 2, description: "PRD撰写、需求评审、优先级排序与迭代规划" },
  { id: "design", phase: "产品设计", phaseNum: 3, description: "业务流程设计、信息架构规划与交互方案制定" },
  { id: "prototype", phase: "原型验证", phaseNum: 4, description: "交互原型制作、用户测试与设计迭代优化" },
  { id: "development", phase: "技术开发", phaseNum: 5, description: "系统架构设计、编码实现与接口联调对接" },
  { id: "testing", phase: "测试验收", phaseNum: 6, description: "功能测试、集成测试、性能测试与用户验收测试" },
  { id: "deployment", phase: "发布部署", phaseNum: 7, description: "发布准备、灰度发布、生产环境部署与监控告警配置" },
  { id: "operations", phase: "运营迭代", phaseNum: 8, description: "数据监控分析、用户反馈收集与产品持续迭代优化" },
];

export interface RoleContent {
  responsibilities: string[];
  deliverables: string[];
  collaborationRoles: string[];
  acceptanceCriteria: string[];
  tools: { name: string; href: string; recommended?: boolean }[];
}

export type WorkflowData = Record<Role, Record<string, RoleContent>>;

export const WORKFLOW_DATA: WorkflowData = {
  pm: {
    planning: {
      responsibilities: [
        "进行市场调研和竞品分析",
        "收集用户需求和痛点",
        "确定产品定位和目标用户",
        "输出市场分析报告",
      ],
      deliverables: ["市场分析报告", "竞品分析报告", "用户调研报告", "产品愿景文档"],
      collaborationRoles: ["CEO", "市场总监", "销售团队"],
      acceptanceCriteria: ["报告内容完整", "数据来源可靠", "竞品覆盖全面"],
      tools: [
        { name: "Perplexity", href: "https://www.perplexity.ai/", recommended: true },
        { name: "ChatGPT", href: "https://chat.openai.com/" },
        { name: "Notion", href: "https://www.notion.so/" },
        { name: "问卷星", href: "https://www.wjx.cn/" },
      ],
    },
    requirements: {
      responsibilities: [
        "撰写产品需求文档(PRD)",
        "梳理业务流程和功能点",
        "组织需求评审会议",
        "确定优先级和迭代计划",
      ],
      deliverables: ["PRD文档", "功能清单", "优先级排序", "迭代路线图"],
      collaborationRoles: ["开发负责人", "设计师", "测试负责人"],
      acceptanceCriteria: ["需求描述清晰", "优先级合理", "评审通过"],
      tools: [
        { name: "Notion", href: "https://www.notion.so/", recommended: true },
        { name: "飞书文档", href: "https://www.feishu.cn/" },
        { name: "Confluence", href: "https://www.atlassian.com/software/confluence" },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
      ],
    },
    design: {
      responsibilities: [
        "设计业务流程图",
        "梳理信息架构(IA)",
        "输出功能流程图",
        "与设计师对接UI需求",
      ],
      deliverables: ["业务流程图", "信息架构图", "功能流程图", "原型需求说明"],
      collaborationRoles: ["设计师", "开发负责人"],
      acceptanceCriteria: ["流程完整", "逻辑清晰", "与开发达成一致"],
      tools: [
        { name: "ProcessOn", href: "https://www.processon.com/", recommended: true },
        { name: "Mermaid", href: "https://mermaid.js.org/" },
        { name: "XMind", href: "https://xmind.cn/" },
        { name: "墨刀", href: "https://modao.cc/" },
      ],
    },
    prototype: {
      responsibilities: [
        "制作交互原型",
        "验证产品逻辑",
        "收集用户反馈",
        "与设计师协作完善UI",
      ],
      deliverables: ["交互原型", "原型演示视频", "用户反馈记录", "UI评审意见"],
      collaborationRoles: ["设计师", "目标用户", "开发负责人"],
      acceptanceCriteria: ["原型可操作", "逻辑走通", "UI符合规范"],
      tools: [
        { name: "墨刀", href: "https://modao.cc/", recommended: true },
        { name: "Figma", href: "https://www.figma.com/" },
        { name: "Axure", href: "https://www.axure.com/" },
        { name: "v0.dev", href: "https://v0.dev/" },
      ],
    },
    development: {
      responsibilities: [
        "编写详细技术需求",
        "对接API接口定义",
        "协调开发资源",
        "跟踪开发进度",
      ],
      deliverables: ["技术需求文档", "API接口文档", "开发进度周报", "变更需求说明"],
      collaborationRoles: ["开发工程师", "设计师", "测试工程师"],
      acceptanceCriteria: ["接口文档完整", "进度按计划", "代码规范通过"],
      tools: [
        { name: "Apifox", href: "https://www.apifox.cn/", recommended: true },
        { name: "飞书项目", href: "https://www.feishu.cn/hardcover/project" },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
    testing: {
      responsibilities: [
        "编写测试验收标准",
        "组织UAT用户验收",
        "收集Bug反馈",
        "确认上线条件",
      ],
      deliverables: ["验收标准文档", "UAT测试报告", "Bug跟踪表", "上线检查单"],
      collaborationRoles: ["测试工程师", "开发工程师", "业务方"],
      acceptanceCriteria: ["测试用例通过", "Bug已修复", "UAT签字确认"],
      tools: [
        { name: "飞书表格", href: "https://www.feishu.cn/hardcover/sheets", recommended: true },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
        { name: "墨刀演示", href: "https://modao.cc/" },
        { name: "Confluence", href: "https://www.atlassian.com/software/confluence" },
      ],
    },
    deployment: {
      responsibilities: [
        "制定上线计划",
        "协调发布流程",
        "监控上线结果",
        "处理紧急问题",
      ],
      deliverables: ["上线计划", "发布公告", "上线报告", "问题跟进表"],
      collaborationRoles: ["运维工程师", "开发工程师", "技术支持"],
      acceptanceCriteria: ["上线平稳", "监控正常", "问题已处理"],
      tools: [
        { name: "飞书项目", href: "https://www.feishu.cn/hardcover/project", recommended: true },
        { name: "钉钉", href: "https://www.dingtalk.com/" },
        { name: "企业微信", href: "https://work.weixin.qq.com/" },
        { name: "PagerDuty", href: "https://www.pagerduty.com/" },
      ],
    },
    operations: {
      responsibilities: [
        "跟踪产品数据指标",
        "收集用户反馈",
        "制定迭代计划",
        "输出数据复盘报告",
      ],
      deliverables: ["数据复盘报告", "迭代需求池", "用户反馈汇总", "产品周报/月报"],
      collaborationRoles: ["运营团队", "设计师", "开发团队"],
      acceptanceCriteria: ["数据指标达标", "反馈已处理", "迭代计划确认"],
      tools: [
        { name: "Mixpanel", href: "https://mixpanel.com/", recommended: true },
        { name: "Metabase", href: "https://www.metabase.com/" },
        { name: "SQL", href: "https://www.mysql.com/" },
        { name: "ChatGPT", href: "https://chat.openai.com/" },
      ],
    },
  },
  developer: {
    planning: {
      responsibilities: [
        "参与技术可行性评估",
        "评估技术风险",
        "了解业务背景和技术栈",
        "参与技术方案讨论",
      ],
      deliverables: ["技术可行性分析", "技术风险评估", "技术调研笔记"],
      collaborationRoles: ["产品经理", "架构师", "技术总监"],
      acceptanceCriteria: ["技术方案可行", "风险已识别", "文档齐全"],
      tools: [
        { name: "GitHub", href: "https://github.com/", recommended: true },
        { name: "Stack Overflow", href: "https://stackoverflow.com/" },
        { name: "Notion", href: "https://www.notion.so/" },
        { name: "Perplexity", href: "https://www.perplexity.ai/" },
      ],
    },
    requirements: {
      responsibilities: [
        "参与需求评审会议",
        "评估技术实现方案",
        "拆分技术任务",
        "估算开发工时",
      ],
      deliverables: ["技术方案设计", "任务拆分文档", "工时评估", "技术评审记录"],
      collaborationRoles: ["产品经理", "测试工程师", "设计师"],
      acceptanceCriteria: ["任务拆分清晰", "工时评估合理", "评审通过"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "Linear", href: "https://linear.app/" },
        { name: "Notion", href: "https://www.notion.so/" },
        { name: "飞书文档", href: "https://www.feishu.cn/" },
      ],
    },
    design: {
      responsibilities: [
        "设计技术架构",
        "编写接口设计文档",
        "制定数据库结构",
        "编写详细设计文档",
      ],
      deliverables: ["架构设计图", "API接口文档", "数据库设计", "详细设计文档"],
      collaborationRoles: ["架构师", "产品经理", "测试工程师"],
      acceptanceCriteria: ["架构设计合理", "接口文档规范", "评审通过"],
      tools: [
        { name: "Apifox", href: "https://www.apifox.cn/", recommended: true },
        { name: "Draw.io", href: "https://app.diagrams.net/" },
        { name: "Mermaid", href: "https://mermaid.js.org/" },
        { name: "Confluence", href: "https://www.atlassian.com/software/confluence" },
      ],
    },
    prototype: {
      responsibilities: [
        "参与原型评审",
        "提供技术实现建议",
        "评估技术可行性",
        "提前规划数据结构",
      ],
      deliverables: ["技术反馈", "数据模型初稿", "技术可行性报告"],
      collaborationRoles: ["产品经理", "设计师"],
      acceptanceCriteria: ["反馈已提交", "方案可行性确认"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "墨刀", href: "https://modao.cc/" },
        { name: "Postman", href: "https://www.postman.com/" },
        { name: "Apifox", href: "https://www.apifox.cn/" },
      ],
    },
    development: {
      responsibilities: [
        "编写高质量代码",
        "Code Review",
        "编写单元测试",
        "编写技术文档",
      ],
      deliverables: ["源代码", "单元测试代码", "技术文档", "部署配置"],
      collaborationRoles: ["测试工程师", "运维工程师", "其他开发"],
      acceptanceCriteria: ["代码通过CI", "单元测试覆盖", "Code Review通过"],
      tools: [
        { name: "VS Code", href: "https://code.visualstudio.com/", recommended: true },
        { name: "GitHub Copilot", href: "https://github.com/features/copilot" },
        { name: "Cursor", href: "https://cursor.sh/" },
        { name: "Git", href: "https://git-scm.com/" },
      ],
    },
    testing: {
      responsibilities: [
        "修复测试发现的Bug",
        "提供测试环境支持",
        "参与问题排查",
        "编写自动化测试",
      ],
      deliverables: ["Bug修复", "自动化测试脚本", "问题排查记录"],
      collaborationRoles: ["测试工程师", "产品经理"],
      acceptanceCriteria: ["Bug已修复", "自动化测试通过", "回归测试通过"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "Postman", href: "https://www.postman.com/" },
        { name: "Jest", href: "https://jestjs.io/" },
        { name: "Selenium", href: "https://www.selenium.dev/" },
      ],
    },
    deployment: {
      responsibilities: [
        "负责代码部署",
        "配置CI/CD流水线",
        "监控服务状态",
        "处理线上问题",
      ],
      deliverables: ["部署脚本", "CI/CD配置", "部署文档", "运维手册"],
      collaborationRoles: ["运维工程师", "测试工程师"],
      acceptanceCriteria: ["部署成功", "监控正常", "问题已处理"],
      tools: [
        { name: "GitHub Actions", href: "https://github.com/features/actions", recommended: true },
        { name: "Docker", href: "https://www.docker.com/" },
        { name: "Kubernetes", href: "https://kubernetes.io/" },
        { name: "Vercel", href: "https://vercel.com/" },
      ],
    },
    operations: {
      responsibilities: [
        "监控系统稳定性",
        "优化系统性能",
        "处理线上故障",
        "参与技术复盘",
      ],
      deliverables: ["性能优化报告", "故障分析报告", "技术复盘文档"],
      collaborationRoles: ["运维工程师", "产品经理"],
      acceptanceCriteria: ["系统稳定", "性能达标", "复盘已完成"],
      tools: [
        { name: "Datadog", href: "https://www.datadoghq.com/", recommended: true },
        { name: "Sentry", href: "https://sentry.io/" },
        { name: "Grafana", href: "https://grafana.com/" },
        { name: "PagerDuty", href: "https://www.pagerduty.com/" },
      ],
    },
  },
  designer: {
    planning: {
      responsibilities: [
        "了解产品定位和目标用户",
        "参与用户调研",
        "收集竞品设计参考",
        "参与产品定位讨论",
      ],
      deliverables: ["设计调研报告", "竞品设计分析", "设计趋势分析"],
      collaborationRoles: ["产品经理", "用户研究员"],
      acceptanceCriteria: ["调研报告完整", "竞品分析深入"],
      tools: [
        { name: "Pinterest", href: "https://www.pinterest.com/", recommended: true },
        { name: "Behance", href: "https://www.behance.net/" },
        { name: "Dribbble", href: "https://dribbble.com/" },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
    requirements: {
      responsibilities: [
        "参与需求评审",
        "理解功能需求",
        "制定设计规范",
        "输出设计初稿",
      ],
      deliverables: ["设计初稿", "设计规范", "设计评审记录", "用户画像"],
      collaborationRoles: ["产品经理", "开发工程师"],
      acceptanceCriteria: ["设计规范完整", "评审通过"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "Sketch", href: "https://www.sketch.com/" },
        { name: "Notion", href: "https://www.notion.so/" },
        { name: "Miro", href: "https://miro.com/" },
      ],
    },
    design: {
      responsibilities: [
        "设计信息架构",
        "设计交互流程",
        "创建线框图",
        "制定UI设计规范",
      ],
      deliverables: ["信息架构图", "交互流程图", "线框图", "UI设计规范"],
      collaborationRoles: ["产品经理", "开发工程师"],
      acceptanceCriteria: ["IA清晰合理", "交互流程顺畅", "规范完善"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "XMind", href: "https://xmind.cn/" },
        { name: "Miro", href: "https://miro.com/" },
        { name: "Mermaid", href: "https://mermaid.js.org/" },
      ],
    },
    prototype: {
      responsibilities: [
        "设计高保真原型",
        "制作交互动画",
        "设计响应式布局",
        "输出设计稿",
      ],
      deliverables: ["高保真设计稿", "交互原型", "设计标注", "设计交付物"],
      collaborationRoles: ["产品经理", "开发工程师", "测试工程师"],
      acceptanceCriteria: ["设计稿完成", "交互符合预期", "响应式适配完整"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "v0.dev", href: "https://v0.dev/" },
        { name: "Framer", href: "https://www.framer.com/" },
        { name: "After Effects", href: "https://www.adobe.com/products/aftereffects.html" },
      ],
    },
    development: {
      responsibilities: [
        "提供设计标注",
        "对接开发实现",
        "验收UI还原度",
        "优化设计方案",
      ],
      deliverables: ["设计标注", "UI验收报告", "设计修改记录"],
      collaborationRoles: ["开发工程师", "产品经理"],
      acceptanceCriteria: ["标注完整", "UI还原度高", "问题已跟进"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "Zeplin", href: "https://zeplin.io/" },
        { name: "Canva", href: "https://www.canva.cn/" },
        { name: "即时设计", href: "https://js.design/" },
      ],
    },
    testing: {
      responsibilities: [
        "参与UI验收",
        "检查视觉一致性",
        "提供设计支持",
        "优化用户体验",
      ],
      deliverables: ["UI验收报告", "视觉问题清单", "优化建议"],
      collaborationRoles: ["测试工程师", "产品经理", "开发工程师"],
      acceptanceCriteria: ["视觉一致", "问题已记录", "优化已跟进"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "飞书文档", href: "https://www.feishu.cn/" },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
    deployment: {
      responsibilities: [
        "检查上线效果",
        "收集用户反馈",
        "优化设计细节",
        "参与上线评审",
      ],
      deliverables: ["上线检查报告", "设计优化建议"],
      collaborationRoles: ["产品经理", "运维工程师"],
      acceptanceCriteria: ["上线效果达标", "问题已记录"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "Canva", href: "https://www.canva.cn/" },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
    operations: {
      responsibilities: [
        "跟踪产品数据",
        "收集用户反馈",
        "优化迭代设计",
        "维护设计系统",
      ],
      deliverables: ["设计复盘报告", "设计迭代记录", "设计系统文档"],
      collaborationRoles: ["产品经理", "开发工程师", "运营团队"],
      acceptanceCriteria: ["数据跟踪完成", "迭代优化到位", "设计系统更新"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "Notion", href: "https://www.notion.so/" },
        { name: "Miro", href: "https://miro.com/" },
        { name: "Storybook", href: "https://storybook.js.org/" },
      ],
    },
  },
  tester: {
    planning: {
      responsibilities: [
        "了解产品需求",
        "评估测试风险",
        "制定测试策略",
        "准备测试环境",
      ],
      deliverables: ["测试计划", "风险评估报告", "测试环境准备清单"],
      collaborationRoles: ["产品经理", "开发工程师"],
      acceptanceCriteria: ["测试计划完整", "风险识别到位", "环境就绪"],
      tools: [
        { name: "Notion", href: "https://www.notion.so/", recommended: true },
        { name: "Confluence", href: "https://www.atlassian.com/software/confluence" },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
      ],
    },
    requirements: {
      responsibilities: [
        "参与需求评审",
        "编写测试用例",
        "制定测试计划",
        "确定测试范围",
      ],
      deliverables: ["测试用例", "测试计划", "测试范围定义"],
      collaborationRoles: ["产品经理", "开发工程师"],
      acceptanceCriteria: ["用例覆盖完整", "评审通过"],
      tools: [
        { name: "飞书表格", href: "https://www.feishu.cn/hardcover/sheets", recommended: true },
        { name: "TestRail", href: "https://www.gurock.com/testrail/" },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
    design: {
      responsibilities: [
        "分析业务流程",
        "设计测试用例",
        "规划测试数据",
        "编写测试脚本",
      ],
      deliverables: ["测试用例设计", "测试脚本", "测试数据准备"],
      collaborationRoles: ["开发工程师", "产品经理"],
      acceptanceCriteria: ["用例设计完整", "脚本可执行"],
      tools: [
        { name: "Postman", href: "https://www.postman.com/", recommended: true },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
        { name: "Mermaid", href: "https://mermaid.js.org/" },
      ],
    },
    prototype: {
      responsibilities: [
        "参与原型评审",
        "验证功能完整性",
        "设计验收测试用例",
        "检查用户体验",
      ],
      deliverables: ["验收测试用例", "原型反馈报告"],
      collaborationRoles: ["产品经理", "设计师"],
      acceptanceCriteria: ["用例覆盖功能", "反馈已提交"],
      tools: [
        { name: "墨刀", href: "https://modao.cc/", recommended: true },
        { name: "Figma", href: "https://www.figma.com/" },
        { name: "飞书表格", href: "https://www.feishu.cn/hardcover/sheets" },
      ],
    },
    development: {
      responsibilities: [
        "执行功能测试",
        "执行接口测试",
        "执行性能测试",
        "提交Bug跟踪",
      ],
      deliverables: ["测试报告", "Bug记录", "测试日志"],
      collaborationRoles: ["开发工程师", "产品经理"],
      acceptanceCriteria: ["测试通过", "Bug已记录", "报告已输出"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "Postman", href: "https://www.postman.com/" },
        { name: "JMeter", href: "https://jmeter.apache.org/" },
        { name: "Selenium", href: "https://www.selenium.dev/" },
      ],
    },
    testing: {
      responsibilities: [
        "执行UAT测试",
        "编写测试报告",
        "验证Bug修复",
        "确认上线条件",
      ],
      deliverables: ["测试报告", "UAT报告", "上线检查单", "Bug回归记录"],
      collaborationRoles: ["产品经理", "开发工程师", "业务方"],
      acceptanceCriteria: ["UAT通过", "Bug已修复", "上线条件满足"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "飞书表格", href: "https://www.feishu.cn/hardcover/sheets" },
        { name: "TestRail", href: "https://www.gurock.com/testrail/" },
        { name: "Confluence", href: "https://www.atlassian.com/software/confluence" },
      ],
    },
    deployment: {
      responsibilities: [
        "执行上线验证",
        "验证生产环境",
        "监控上线问题",
        "提供测试支持",
      ],
      deliverables: ["上线验证报告", "生产问题记录"],
      collaborationRoles: ["运维工程师", "开发工程师"],
      acceptanceCriteria: ["上线验证通过", "问题已记录"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "飞书", href: "https://www.feishu.cn/" },
        { name: "Datadog", href: "https://www.datadoghq.com/" },
      ],
    },
    operations: {
      responsibilities: [
        "收集线上问题",
        "跟踪线上Bug",
        "分析故障原因",
        "优化测试策略",
      ],
      deliverables: ["线上问题分析", "测试复盘报告", "改进建议"],
      collaborationRoles: ["运维工程师", "开发工程师", "产品经理"],
      acceptanceCriteria: ["问题已分析", "改进已实施"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "飞书表格", href: "https://www.feishu.cn/hardcover/sheets" },
        { name: "Sentry", href: "https://sentry.io/" },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
  },
  ops: {
    planning: {
      responsibilities: [
        "评估基础设施需求",
        "制定运维策略",
        "规划容量方案",
        "评估技术风险",
      ],
      deliverables: ["运维规划", "容量规划", "风险评估"],
      collaborationRoles: ["产品经理", "开发负责人", "架构师"],
      acceptanceCriteria: ["规划完整", "风险已识别"],
      tools: [
        { name: "Notion", href: "https://www.notion.so/", recommended: true },
        { name: "Excel", href: "https://www.microsoft.com/microsoft-365/excel" },
        { name: "Confluence", href: "https://www.atlassian.com/software/confluence" },
      ],
    },
    requirements: {
      responsibilities: [
        "评估运维需求",
        "制定部署流程",
        "规划监控方案",
        "准备运维文档",
      ],
      deliverables: ["运维需求文档", "部署流程设计", "监控方案"],
      collaborationRoles: ["开发工程师", "产品经理"],
      acceptanceCriteria: ["需求文档完整", "方案可行"],
      tools: [
        { name: "Notion", href: "https://www.notion.so/", recommended: true },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
        { name: "飞书文档", href: "https://www.feishu.cn/" },
      ],
    },
    design: {
      responsibilities: [
        "设计系统架构",
        "规划网络拓扑",
        "设计备份方案",
        "制定安全策略",
      ],
      deliverables: ["架构设计", "网络拓扑图", "备份方案", "安全策略"],
      collaborationRoles: ["架构师", "开发工程师"],
      acceptanceCriteria: ["架构设计合理", "安全策略完善"],
      tools: [
        { name: "Draw.io", href: "https://app.diagrams.net/", recommended: true },
        { name: "Mermaid", href: "https://mermaid.js.org/" },
        { name: "Cloudcraft", href: "https://cloudcraft.co/" },
      ],
    },
    prototype: {
      responsibilities: [
        "参与原型评审",
        "评估运维可行性",
        "规划测试环境",
        "设计部署流程",
      ],
      deliverables: ["环境规划", "部署流程设计", "运维反馈"],
      collaborationRoles: ["产品经理", "开发工程师"],
      acceptanceCriteria: ["环境规划完成", "部署流程可行"],
      tools: [
        { name: "Docker", href: "https://www.docker.com/", recommended: true },
        { name: "Figma", href: "https://www.figma.com/" },
        { name: "Terraform", href: "https://www.terraform.io/" },
      ],
    },
    development: {
      responsibilities: [
        "配置CI/CD流水线",
        "管理测试环境",
        "编写部署脚本",
        "监控系统开发",
      ],
      deliverables: ["CI/CD配置", "部署脚本", "监控配置", "运维手册"],
      collaborationRoles: ["开发工程师", "测试工程师"],
      acceptanceCriteria: ["CI/CD可用", "脚本可执行", "监控就绪"],
      tools: [
        { name: "GitHub Actions", href: "https://github.com/features/actions", recommended: true },
        { name: "Docker", href: "https://www.docker.com/" },
        { name: "Kubernetes", href: "https://kubernetes.io/" },
        { name: "Ansible", href: "https://www.ansible.com/" },
      ],
    },
    testing: {
      responsibilities: [
        "提供测试环境支持",
        "配置测试服务器",
        "监控测试性能",
        "处理测试问题",
      ],
      deliverables: ["环境配置", "性能测试报告", "问题处理记录"],
      collaborationRoles: ["测试工程师", "开发工程师"],
      acceptanceCriteria: ["环境稳定", "性能达标"],
      tools: [
        { name: "Docker", href: "https://www.docker.com/", recommended: true },
        { name: "K6", href: "https://k6.io/" },
        { name: "Grafana", href: "https://grafana.com/" },
        { name: "Prometheus", href: "https://prometheus.io/" },
      ],
    },
    deployment: {
      responsibilities: [
        "执行生产部署",
        "监控服务状态",
        "处理线上故障",
        "管理发布流程",
      ],
      deliverables: ["部署记录", "监控仪表盘", "故障报告", "发布检查单"],
      collaborationRoles: ["开发工程师", "测试工程师", "产品经理"],
      acceptanceCriteria: ["部署成功", "监控正常", "故障已处理"],
      tools: [
        { name: "GitHub Actions", href: "https://github.com/features/actions", recommended: true },
        { name: "Docker", href: "https://www.docker.com/" },
        { name: "Kubernetes", href: "https://kubernetes.io/" },
        { name: "PagerDuty", href: "https://www.pagerduty.com/" },
      ],
    },
    operations: {
      responsibilities: [
        "监控系统运行",
        "优化系统性能",
        "管理日志分析",
        "制定应急预案",
      ],
      deliverables: ["运维报告", "性能优化建议", "日志分析", "应急预案"],
      collaborationRoles: ["开发工程师", "产品经理"],
      acceptanceCriteria: ["系统稳定", "性能优化完成", "预案已制定"],
      tools: [
        { name: "Datadog", href: "https://www.datadoghq.com/", recommended: true },
        { name: "Grafana", href: "https://grafana.com/" },
        { name: "Sentry", href: "https://sentry.io/" },
        { name: "Elastic", href: "https://www.elastic.co/" },
      ],
    },
  },
  pmo: {
    planning: {
      responsibilities: [
        "制定项目整体计划",
        "识别项目风险和依赖",
        "协调跨部门资源",
        "建立项目沟通机制",
      ],
      deliverables: ["项目计划书", "风险评估表", "资源协调表", "沟通管理计划"],
      collaborationRoles: ["产品经理", "开发负责人", "高管"],
      acceptanceCriteria: ["计划可行", "风险可控", "资源已确认"],
      tools: [
        { name: "Project", href: "https://www.microsoft.com/project", recommended: true },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
        { name: "Notion", href: "https://www.notion.so/" },
        { name: "飞书项目", href: "https://www.feishu.cn/hardcover/project" },
      ],
    },
    requirements: {
      responsibilities: [
        "协调需求评审会议",
        "跟踪需求变更",
        "管理需求优先级冲突",
        "确保各方预期一致",
      ],
      deliverables: ["评审会议纪要", "需求变更记录", "优先级决策表"],
      collaborationRoles: ["产品经理", "开发负责人", "业务方"],
      acceptanceCriteria: ["评审完成", "变更可控", "决策记录"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "Confluence", href: "https://www.atlassian.com/software/confluence" },
        { name: "飞书", href: "https://www.feishu.cn/" },
      ],
    },
    design: {
      responsibilities: [
        "跟踪设计评审进度",
        "协调设计资源",
        "管理设计里程碑",
        "确保设计交付时间",
      ],
      deliverables: ["设计评审报告", "里程碑进度表"],
      collaborationRoles: ["设计师", "产品经理"],
      acceptanceCriteria: ["评审通过", "进度正常"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "Figma", href: "https://www.figma.com/" },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
    prototype: {
      responsibilities: [
        "管理原型评审节奏",
        "协调评审会议",
        "跟踪反馈收集",
        "控制迭代周期",
      ],
      deliverables: ["评审会议记录", "迭代进度报告"],
      collaborationRoles: ["产品经理", "设计师", "开发负责人"],
      acceptanceCriteria: ["评审有效", "迭代可控"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "墨刀", href: "https://modao.cc/" },
        { name: "飞书", href: "https://www.feishu.cn/" },
      ],
    },
    development: {
      responsibilities: [
        "监控开发进度",
        "协调资源冲突",
        "管理风险问题",
        "汇报项目状态",
      ],
      deliverables: ["周报/日报", "风险跟踪表", "进度偏差分析"],
      collaborationRoles: ["开发负责人", "产品经理", "测试工程师"],
      acceptanceCriteria: ["进度透明", "风险可控", "及时汇报"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "飞书项目", href: "https://www.feishu.cn/hardcover/project" },
        { name: "PowerBI", href: "https://powerbi.microsoft.com/" },
      ],
    },
    testing: {
      responsibilities: [
        "跟踪测试进度",
        "协调测试资源",
        "管理测试风险",
        "组织上线评审",
      ],
      deliverables: ["测试进度报告", "上线评审材料", "风险跟踪表"],
      collaborationRoles: ["测试工程师", "开发工程师", "产品经理"],
      acceptanceCriteria: ["测试完成", "风险已知", "评审通过"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "飞书", href: "https://www.feishu.cn/" },
        { name: "TestRail", href: "https://www.gurock.com/testrail/" },
      ],
    },
    deployment: {
      responsibilities: [
        "协调发布计划",
        "跟踪发布准备",
        "管理发布风险",
        "主持发布会议",
      ],
      deliverables: ["发布计划", "发布检查单", "发布会议纪要"],
      collaborationRoles: ["运维工程师", "开发工程师", "测试工程师"],
      acceptanceCriteria: ["计划周全", "准备就绪", "回滚方案明确"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "飞书项目", href: "https://www.feishu.cn/hardcover/project" },
        { name: "PagerDuty", href: "https://www.pagerduty.com/" },
      ],
    },
    operations: {
      responsibilities: [
        "组织迭代复盘",
        "跟踪改进措施",
        "协调跨团队沟通",
        "汇报项目总结",
      ],
      deliverables: ["复盘报告", "改进跟踪表", "项目总结报告"],
      collaborationRoles: ["产品经理", "开发团队", "业务方"],
      acceptanceCriteria: ["复盘完成", "改进措施落地"],
      tools: [
        { name: "Notion", href: "https://www.notion.so/", recommended: true },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
        { name: "飞书", href: "https://www.feishu.cn/" },
      ],
    },
  },
  architect: {
    planning: {
      responsibilities: [
        "评估技术可行性",
        "制定技术路线图",
        "分析技术风险",
        "参与技术选型",
      ],
      deliverables: ["技术可行性报告", "技术路线图", "技术风险评估"],
      collaborationRoles: ["产品经理", "开发负责人"],
      acceptanceCriteria: ["技术路线清晰", "风险已识别"],
      tools: [
        { name: "Draw.io", href: "https://app.diagrams.net/", recommended: true },
        { name: "Mermaid", href: "https://mermaid.js.org/" },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
    requirements: {
      responsibilities: [
        "评审技术方案",
        "制定架构约束",
        "评估非功能性需求",
        "提供技术建议",
      ],
      deliverables: ["架构约束文档", "技术评审报告", "非功能需求评估"],
      collaborationRoles: ["开发负责人", "产品经理"],
      acceptanceCriteria: ["约束明确", "评审通过"],
      tools: [
        { name: "Confluence", href: "https://www.atlassian.com/software/confluence", recommended: true },
        { name: "Draw.io", href: "https://app.diagrams.net/" },
        { name: "Archi", href: "https://www.archimatetool.com/" },
      ],
    },
    design: {
      responsibilities: [
        "设计系统架构",
        "制定技术规范",
        "评审详细设计",
        "定义接口契约",
      ],
      deliverables: ["架构设计文档", "技术规范", "接口契约", "架构评审报告"],
      collaborationRoles: ["开发工程师", "产品经理"],
      acceptanceCriteria: ["架构设计合理", "规范完善", "评审通过"],
      tools: [
        { name: "Draw.io", href: "https://app.diagrams.net/", recommended: true },
        { name: "Mermaid", href: "https://mermaid.js.org/" },
        { name: "Apifox", href: "https://www.apifox.cn/" },
        { name: "Cloudcraft", href: "https://cloudcraft.co/" },
      ],
    },
    prototype: {
      responsibilities: [
        "评审技术原型",
        "评估实现难度",
        "提供技术建议",
        "验证架构可行性",
      ],
      deliverables: ["技术评审意见", "架构验证报告"],
      collaborationRoles: ["开发负责人", "产品经理", "设计师"],
      acceptanceCriteria: ["评审完成", "建议已采纳"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "Draw.io", href: "https://app.diagrams.net/" },
      ],
    },
    development: {
      responsibilities: [
        "提供技术指导",
        "评审核心代码",
        "解决技术难题",
        "优化系统架构",
      ],
      deliverables: ["技术指导文档", "代码评审报告", "架构优化建议"],
      collaborationRoles: ["开发工程师"],
      acceptanceCriteria: ["指导到位", "代码质量达标"],
      tools: [
        { name: "GitHub", href: "https://github.com/", recommended: true },
        { name: "VS Code", href: "https://code.visualstudio.com/" },
        { name: "SonarQube", href: "https://www.sonarqube.org/" },
      ],
    },
    testing: {
      responsibilities: [
        "评审测试架构",
        "提供技术支持",
        "分析复杂问题",
        "优化测试环境",
      ],
      deliverables: ["测试架构评审", "技术支持记录"],
      collaborationRoles: ["测试工程师", "开发工程师"],
      acceptanceCriteria: ["架构合理", "支持到位"],
      tools: [
        { name: "Postman", href: "https://www.postman.com/", recommended: true },
        { name: "JMeter", href: "https://jmeter.apache.org/" },
      ],
    },
    deployment: {
      responsibilities: [
        "评审部署方案",
        "制定扩容策略",
        "评估监控需求",
        "优化系统性能",
      ],
      deliverables: ["部署架构评审", "扩容策略", "监控方案"],
      collaborationRoles: ["运维工程师", "开发工程师"],
      acceptanceCriteria: ["方案可行", "性能达标"],
      tools: [
        { name: "Docker", href: "https://www.docker.com/", recommended: true },
        { name: "Kubernetes", href: "https://kubernetes.io/" },
        { name: "Grafana", href: "https://grafana.com/" },
      ],
    },
    operations: {
      responsibilities: [
        "评审系统架构",
        "优化技术债",
        "制定演进计划",
        "评估技术趋势",
      ],
      deliverables: ["架构评估报告", "技术债清单", "演进路线图"],
      collaborationRoles: ["开发团队", "产品经理"],
      acceptanceCriteria: ["架构健康", "技术债可控"],
      tools: [
        { name: "Datadog", href: "https://www.datadoghq.com/", recommended: true },
        { name: "Draw.io", href: "https://app.diagrams.net/" },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
  },
  ux_researcher: {
    planning: {
      responsibilities: [
        "制定用户研究计划",
        "设计调研方案",
        "招募目标用户",
        "准备调研材料",
      ],
      deliverables: ["用户研究计划", "调研方案", "用户筛选条件", "访谈大纲"],
      collaborationRoles: ["产品经理", "设计师"],
      acceptanceCriteria: ["计划完整", "用户匹配"],
      tools: [
        { name: "Notion", href: "https://www.notion.so/", recommended: true },
        { name: "问卷星", href: "https://www.wjx.cn/" },
        { name: "UserTesting", href: "https://www.usertesting.com/" },
      ],
    },
    requirements: {
      responsibilities: [
        "执行用户访谈",
        "分析用户反馈",
        "输出用户画像",
        "验证需求假设",
      ],
      deliverables: ["用户访谈报告", "用户画像", "需求验证报告", "痛点分析"],
      collaborationRoles: ["产品经理", "设计师"],
      acceptanceCriteria: ["访谈完成", "画像清晰", "假设验证"],
      tools: [
        { name: "Dovetail", href: "https://dovetail.com/", recommended: true },
        { name: "Notion", href: "https://www.notion.so/" },
        { name: "Miro", href: "https://miro.com/" },
      ],
    },
    design: {
      responsibilities: [
        "提供用户体验洞察",
        "评审信息架构",
        "参与交互设计",
        "验证设计假设",
      ],
      deliverables: ["体验洞察报告", "IA评审意见", "交互设计建议"],
      collaborationRoles: ["设计师", "产品经理"],
      acceptanceCriteria: ["洞察有价值", "建议已采纳"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "Miro", href: "https://miro.com/" },
        { name: "Hotjar", href: "https://www.hotjar.com/" },
      ],
    },
    prototype: {
      responsibilities: [
        "执行可用性测试",
        "收集用户反馈",
        "分析测试结果",
        "输出优化建议",
      ],
      deliverables: ["可用性测试报告", "用户反馈汇总", "优化建议清单"],
      collaborationRoles: ["设计师", "产品经理"],
      acceptanceCriteria: ["测试完成", "问题已识别", "建议已输出"],
      tools: [
        { name: "UserTesting", href: "https://www.usertesting.com/", recommended: true },
        { name: "Optimal Workshop", href: "https://www.optimalworkshop.com/" },
        { name: "Miro", href: "https://miro.com/" },
      ],
    },
    development: {
      responsibilities: [
        "提供UX技术支持",
        "解答体验问题",
        "参与设计走查",
        "记录体验指标",
      ],
      deliverables: ["体验问题解答", "设计走查报告", "体验指标定义"],
      collaborationRoles: ["设计师", "开发工程师"],
      acceptanceCriteria: ["支持到位", "指标明确"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "Hotjar", href: "https://www.hotjar.com/" },
      ],
    },
    testing: {
      responsibilities: [
        "执行UAT体验评审",
        "收集真实用户反馈",
        "分析体验问题",
        "验证体验改进",
      ],
      deliverables: ["体验评审报告", "用户反馈分析", "体验改进验证"],
      collaborationRoles: ["设计师", "产品经理", "测试工程师"],
      acceptanceCriteria: ["评审完成", "改进已验证"],
      tools: [
        { name: "UserTesting", href: "https://www.usertesting.com/", recommended: true },
        { name: "飞书", href: "https://www.feishu.cn/" },
      ],
    },
    deployment: {
      responsibilities: [
        "收集上线后用户反馈",
        "监测用户体验指标",
        "分析用户行为",
        "输出体验报告",
      ],
      deliverables: ["用户反馈报告", "体验监测报告", "行为分析报告"],
      collaborationRoles: ["产品经理", "设计师"],
      acceptanceCriteria: ["数据收集", "报告已输出"],
      tools: [
        { name: "Hotjar", href: "https://www.hotjar.com/", recommended: true },
        { name: "Mixpanel", href: "https://mixpanel.com/" },
        { name: "Amplitude", href: "https://amplitude.com/" },
      ],
    },
    operations: {
      responsibilities: [
        "持续用户研究",
        "跟踪体验指标",
        "分析用户流失",
        "提出优化建议",
      ],
      deliverables: ["体验优化报告", "用户研究季报", "流失分析报告"],
      collaborationRoles: ["产品经理", "设计师", "数据分析师"],
      acceptanceCriteria: ["研究持续", "优化有成效"],
      tools: [
        { name: "Dovetail", href: "https://dovetail.com/", recommended: true },
        { name: "Hotjar", href: "https://www.hotjar.com/" },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
  },
  analyst: {
    planning: {
      responsibilities: [
        "分析市场数据",
        "收集行业指标",
        "建立数据看板",
        "支持决策分析",
      ],
      deliverables: ["市场分析报告", "数据看板", "行业指标基准"],
      collaborationRoles: ["产品经理", "高管"],
      acceptanceCriteria: ["数据准确", "看板可用"],
      tools: [
        { name: "Tableau", href: "https://www.tableau.com/", recommended: true },
        { name: "PowerBI", href: "https://powerbi.microsoft.com/" },
        { name: "SQL", href: "https://www.mysql.com/" },
      ],
    },
    requirements: {
      responsibilities: [
        "分析历史数据",
        "定义数据指标",
        "设计埋点方案",
        "评审需求数据可行性",
      ],
      deliverables: ["指标定义文档", "埋点方案", "数据需求评审报告"],
      collaborationRoles: ["产品经理", "开发工程师"],
      acceptanceCriteria: ["指标定义清晰", "方案可行"],
      tools: [
        { name: "Mixpanel", href: "https://mixpanel.com/", recommended: true },
        { name: "Amplitude", href: "https://amplitude.com/" },
        { name: "Metabase", href: "https://www.metabase.com/" },
      ],
    },
    design: {
      responsibilities: [
        "评审数据展示设计",
        "提供数据洞察",
        "优化数据可视化",
        "定义数据看板需求",
      ],
      deliverables: ["数据可视化评审", "看板需求文档", "可视化建议"],
      collaborationRoles: ["设计师", "产品经理"],
      acceptanceCriteria: ["设计有数据支撑", "建议合理"],
      tools: [
        { name: "Tableau", href: "https://www.tableau.com/", recommended: true },
        { name: "Figma", href: "https://www.figma.com/" },
        { name: "Metabase", href: "https://www.metabase.com/" },
      ],
    },
    prototype: {
      responsibilities: [
        "验证原型数据可行性",
        "提供数据示例",
        "评审数据展示",
        "优化数据流程",
      ],
      deliverables: ["数据验证报告", "示例数据", "评审意见"],
      collaborationRoles: ["产品经理", "设计师", "开发工程师"],
      acceptanceCriteria: ["数据可行", "流程合理"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "Mockaroo", href: "https://www.mockaroo.com/" },
      ],
    },
    development: {
      responsibilities: [
        "设计数据模型",
        "评审数据库设计",
        "优化数据查询",
        "编写数据文档",
      ],
      deliverables: ["数据模型文档", "SQL评审报告", "性能优化建议"],
      collaborationRoles: ["开发工程师", "运维工程师"],
      acceptanceCriteria: ["模型合理", "文档完善"],
      tools: [
        { name: "SQL", href: "https://www.mysql.com/", recommended: true },
        { name: "Metabase", href: "https://www.metabase.com/" },
        { name: "Navicat", href: "https://www.navicat.com/" },
      ],
    },
    testing: {
      responsibilities: [
        "验证数据准确性",
        "编写数据测试用例",
        "检查数据埋点",
        "分析数据异常",
      ],
      deliverables: ["数据验证报告", "埋点测试报告", "异常分析报告"],
      collaborationRoles: ["测试工程师", "开发工程师", "产品经理"],
      acceptanceCriteria: ["数据准确", "埋点正确"],
      tools: [
        { name: "Great Expectations", href: "https://greatexpectations.io/", recommended: true },
        { name: "Metabase", href: "https://www.metabase.com/" },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
      ],
    },
    deployment: {
      responsibilities: [
        "验证上线数据指标",
        "监测数据质量",
        "配置数据看板",
        "发布数据报告",
      ],
      deliverables: ["数据质量报告", "看板配置文档", "上线数据确认"],
      collaborationRoles: ["运维工程师", "产品经理"],
      acceptanceCriteria: ["质量达标", "看板就绪"],
      tools: [
        { name: "Datadog", href: "https://www.datadoghq.com/", recommended: true },
        { name: "Metabase", href: "https://www.metabase.com/" },
        { name: "Great Expectations", href: "https://greatexpectations.io/" },
      ],
    },
    operations: {
      responsibilities: [
        "监控核心指标",
        "分析数据趋势",
        "输出数据报告",
        "支持运营决策",
      ],
      deliverables: ["日常数据报告", "趋势分析报告", "专题分析报告"],
      collaborationRoles: ["产品经理", "运营团队", "高管"],
      acceptanceCriteria: ["报告及时", "分析有价值"],
      tools: [
        { name: "Tableau", href: "https://www.tableau.com/", recommended: true },
        { name: "Mixpanel", href: "https://mixpanel.com/" },
        { name: "Metabase", href: "https://www.metabase.com/" },
      ],
    },
  },
  stakeholder: {
    planning: {
      responsibilities: [
        "提出业务需求",
        "参与市场调研",
        "定义业务目标",
        "评审调研结果",
      ],
      deliverables: ["业务需求文档", "业务目标", "调研反馈"],
      collaborationRoles: ["产品经理", "高管"],
      acceptanceCriteria: ["需求清晰", "目标明确"],
      tools: [
        { name: "飞书文档", href: "https://www.feishu.cn/", recommended: true },
        { name: "Notion", href: "https://www.notion.so/" },
        { name: "钉钉", href: "https://www.dingtalk.com/" },
      ],
    },
    requirements: {
      responsibilities: [
        "参与需求评审",
        "提供业务专业知识",
        "确认需求优先级",
        "验收业务需求",
      ],
      deliverables: ["需求评审意见", "优先级确认", "业务验收签字"],
      collaborationRoles: ["产品经理"],
      acceptanceCriteria: ["评审参与", "需求确认"],
      tools: [
        { name: "飞书文档", href: "https://www.feishu.cn/", recommended: true },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
      ],
    },
    design: {
      responsibilities: [
        "评审业务流程设计",
        "提供业务反馈",
        "确认业务规则",
        "参与设计评审",
      ],
      deliverables: ["流程评审意见", "业务规则确认", "设计评审反馈"],
      collaborationRoles: ["产品经理", "设计师"],
      acceptanceCriteria: ["流程符合业务", "规则正确"],
      tools: [
        { name: "飞书文档", href: "https://www.feishu.cn/", recommended: true },
        { name: "Figma", href: "https://www.figma.com/" },
      ],
    },
    prototype: {
      responsibilities: [
        "评审原型演示",
        "提供业务反馈",
        "验证业务场景",
        "确认用户体验",
      ],
      deliverables: ["原型评审意见", "业务场景验证", "反馈记录"],
      collaborationRoles: ["产品经理", "设计师"],
      acceptanceCriteria: ["场景覆盖", "反馈已收集"],
      tools: [
        { name: "墨刀", href: "https://modao.cc/", recommended: true },
        { name: "飞书", href: "https://www.feishu.cn/" },
      ],
    },
    development: {
      responsibilities: [
        "提供业务咨询",
        "解答业务问题",
        "参与业务验收",
        "确认开发范围",
      ],
      deliverables: ["业务咨询记录", "范围确认", "业务验收意见"],
      collaborationRoles: ["产品经理", "开发工程师"],
      acceptanceCriteria: ["咨询已响应", "范围已确认"],
      tools: [
        { name: "飞书", href: "https://www.feishu.cn/", recommended: true },
        { name: "Jira", href: "https://www.atlassian.com/software/jira" },
      ],
    },
    testing: {
      responsibilities: [
        "参与UAT测试",
        "验证业务功能",
        "提供验收意见",
        "确认上线条件",
      ],
      deliverables: ["UAT测试反馈", "验收意见书", "上线确认单"],
      collaborationRoles: ["产品经理", "测试工程师"],
      acceptanceCriteria: ["UAT完成", "验收通过"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "飞书", href: "https://www.feishu.cn/" },
      ],
    },
    deployment: {
      responsibilities: [
        "参与上线评审",
        "确认业务准备",
        "发布业务公告",
        "接收线上反馈",
      ],
      deliverables: ["上线评审意见", "业务公告", "反馈记录"],
      collaborationRoles: ["产品经理", "运维工程师"],
      acceptanceCriteria: ["评审参与", "公告已发"],
      tools: [
        { name: "飞书", href: "https://www.feishu.cn/", recommended: true },
        { name: "钉钉", href: "https://www.dingtalk.com/" },
      ],
    },
    operations: {
      responsibilities: [
        "跟踪业务指标",
        "收集内部反馈",
        "提出优化需求",
        "参与业务复盘",
      ],
      deliverables: ["业务反馈", "优化需求", "复盘意见"],
      collaborationRoles: ["产品经理", "运营团队"],
      acceptanceCriteria: ["反馈已收集", "复盘已参与"],
      tools: [
        { name: "飞书", href: "https://www.feishu.cn/", recommended: true },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
  },
  executive: {
    planning: {
      responsibilities: [
        "确定产品战略方向",
        "审批产品规划",
        "分配资源预算",
        "评审市场定位",
      ],
      deliverables: ["产品战略文档", "预算审批", "资源分配表"],
      collaborationRoles: ["产品经理"],
      acceptanceCriteria: ["战略清晰", "资源已批"],
      tools: [
        { name: "PPT", href: "https://www.microsoft.com/microsoft-365/powerpoint", recommended: true },
        { name: "飞书文档", href: "https://www.feishu.cn/" },
      ],
    },
    requirements: {
      responsibilities: [
        "审批重大需求",
        "参与重要评审",
        "决策需求优先级",
        "把控产品方向",
      ],
      deliverables: ["需求审批意见", "优先级决策"],
      collaborationRoles: ["产品经理"],
      acceptanceCriteria: ["决策已做", "方向已定"],
      tools: [
        { name: "飞书", href: "https://www.feishu.cn/", recommended: true },
        { name: "Notion", href: "https://www.notion.so/" },
      ],
    },
    design: {
      responsibilities: [
        "评审重大设计",
        "把控产品方向",
        "提供战略意见",
        "审批关键决策",
      ],
      deliverables: ["设计评审意见", "战略指引"],
      collaborationRoles: ["产品经理", "设计师"],
      acceptanceCriteria: ["方向正确", "决策已批"],
      tools: [
        { name: "Figma", href: "https://www.figma.com/", recommended: true },
        { name: "PPT", href: "https://www.microsoft.com/microsoft-365/powerpoint" },
      ],
    },
    prototype: {
      responsibilities: [
        "评审关键原型",
        "做战略决策",
        "提供方向指引",
        "审批重大功能",
      ],
      deliverables: ["原型评审意见", "决策记录"],
      collaborationRoles: ["产品经理", "设计师"],
      acceptanceCriteria: ["决策已做"],
      tools: [
        { name: "墨刀", href: "https://modao.cc/", recommended: true },
        { name: "Figma", href: "https://www.figma.com/" },
      ],
    },
    development: {
      responsibilities: [
        "审批技术方案",
        "把控项目风险",
        "听取进度汇报",
        "决策资源调配",
      ],
      deliverables: ["方案审批", "进度汇报材料", "风险决策"],
      collaborationRoles: ["产品经理", "开发负责人", "项目经理"],
      acceptanceCriteria: ["方案已批", "风险可控"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "飞书", href: "https://www.feishu.cn/" },
        { name: "PPT", href: "https://www.microsoft.com/microsoft-365/powerpoint" },
      ],
    },
    testing: {
      responsibilities: [
        "听取测试汇报",
        "审批重大发布",
        "决策质量标准",
        "把控发布风险",
      ],
      deliverables: ["测试汇报", "发布审批", "质量决策"],
      collaborationRoles: ["产品经理", "测试工程师"],
      acceptanceCriteria: ["汇报已完成", "发布已批"],
      tools: [
        { name: "Jira", href: "https://www.atlassian.com/software/jira", recommended: true },
        { name: "飞书", href: "https://www.feishu.cn/" },
      ],
    },
    deployment: {
      responsibilities: [
        "审批发布计划",
        "决策上线时间",
        "听取发布汇报",
        "处理重大问题",
      ],
      deliverables: ["发布审批", "上线决策", "问题升级处理"],
      collaborationRoles: ["产品经理", "运维工程师"],
      acceptanceCriteria: ["发布已批", "问题已处理"],
      tools: [
        { name: "飞书", href: "https://www.feishu.cn/", recommended: true },
        { name: "PagerDuty", href: "https://www.pagerduty.com/" },
      ],
    },
    operations: {
      responsibilities: [
        "审批产品路线图",
        "评审产品业绩",
        "决策产品方向调整",
        "听取战略汇报",
      ],
      deliverables: ["路线图审批", "业绩评审报告", "方向调整决策"],
      collaborationRoles: ["产品经理"],
      acceptanceCriteria: ["路线图已批", "复盘已完成"],
      tools: [
        { name: "PPT", href: "https://www.microsoft.com/microsoft-365/powerpoint", recommended: true },
        { name: "Tableau", href: "https://www.tableau.com/" },
        { name: "飞书", href: "https://www.feishu.cn/" },
      ],
    },
  },
};
