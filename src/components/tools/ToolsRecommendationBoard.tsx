"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

type ToolItem = {
  name: string;
  href: string;
  recommended?: boolean;
  ai?: boolean;
};

type ToolRow = {
  phase: string;
  docType: string;
  tools: ToolItem[];
  description: string;
  highlights?: string[];
};

const TOOL_ROWS: ToolRow[] = [
  {
    phase: "1. 规划调研",
    docType: "市场/竞品分析",
    tools: [
      { name: "Perplexity", href: "https://www.perplexity.ai/" },
      { name: "ChatGPT", href: "https://chat.openai.com/" },
      { name: "Notion", href: "https://www.notion.so/" },
    ],
    description: "擅长实时联网搜集竞品动态，并把调研结论结构化沉淀到知识库。",
    highlights: ["Perplexity", "Notion"],
  },
  {
    phase: "2. 需求定义",
    docType: "PRD（核心文档）",
    tools: [
      { name: "Notion", href: "https://www.notion.so/" },
      { name: "飞书文档", href: "https://www.feishu.cn/" },
      { name: "Confluence", href: "https://www.atlassian.com/software/confluence" },
    ],
    description: "适合撰写需求文档、多人评审和评论，AI 可基于大纲自动扩写功能细节。",
    highlights: ["Notion AI", "飞书"],
  },
  {
    phase: "2. 需求定义",
    docType: "用户故事",
    tools: [
      { name: "Jira", href: "https://www.atlassian.com/software/jira" },
      { name: "Linear", href: "https://linear.app/" },
      { name: "Trello", href: "https://trello.com/" },
    ],
    description: "把 PRD 拆解为原子级任务卡片，适合持续推进与跨角色协作。",
    highlights: ["Linear"],
  },
  {
    phase: "3. 逻辑设计",
    docType: "业务流程图",
    tools: [
      { name: "ProcessOn", href: "https://www.processon.com/" },
      { name: "Mermaid", href: "https://mermaid.js.org/" },
      { name: "Lucidchart", href: "https://www.lucidchart.com/" },
    ],
    description: "支持从文本快速生成流程图，中文模板丰富，适合业务链路梳理。",
    highlights: ["Mermaid", "ProcessOn"],
  },
  {
    phase: "3. 逻辑设计",
    docType: "信息架构图（IA）",
    tools: [
      { name: "XMind", href: "https://xmind.cn/" },
      { name: "MindNode", href: "https://mindnode.com/" },
    ],
    description: "用于梳理产品骨架，AI 可辅助建议后台管理或电商类目层级。",
  },
  {
    phase: "4. 原型实现",
    docType: "快速原型 / 交互稿",
    tools: [
      { name: "墨刀", href: "https://modao.cc/", recommended: true, ai: true },
      { name: "Figma", href: "https://www.figma.com/" },
      { name: "Axure", href: "https://www.axure.com/" },
    ],
    description: "国内 PM 上手快，组件库丰富，可一键生成原型页面，适合移动端快速演示。",
    highlights: ["墨刀"],
  },
  {
    phase: "4. 原型实现",
    docType: "高保真 / UI 协作",
    tools: [
      { name: "Figma", href: "https://www.figma.com/" },
      { name: "v0.dev", href: "https://v0.dev/", ai: true },
    ],
    description: "Figma 适合设计协作，v0 适合有前端基础的 PM 直接生成 React UI 代码。",
    highlights: ["Figma", "v0.dev"],
  },
  {
    phase: "5. 技术对接",
    docType: "接口定义（API）",
    tools: [
      { name: "Apifox", href: "https://www.apifox.cn/", ai: true },
      { name: "Postman", href: "https://www.postman.com/" },
    ],
    description: "定义业务字段、维护接口契约，并自动生成 Mock 数据供前端先行开发。",
    highlights: ["Apifox"],
  },
  {
    phase: "5. 技术对接",
    docType: "埋点需求（DRD）",
    tools: [
      { name: "Excel", href: "https://www.microsoft.com/microsoft-365/excel" },
      { name: "Amplitude", href: "https://amplitude.com/" },
      { name: "神策", href: "https://www.sensorsdata.cn/" },
    ],
    description: "用于定义用户行为追踪逻辑，AI 可辅助梳理漏斗模型中的关键转化埋点。",
  },
  {
    phase: "6. 执行监控",
    docType: "研发进度看板",
    tools: [
      { name: "飞书项目", href: "https://www.feishu.cn/hardcover/project" },
      { name: "Jira", href: "https://www.atlassian.com/software/jira" },
      { name: "Linear", href: "https://linear.app/" },
    ],
    description: "实时同步开发进度，AI 可分析历史速度并预测延期风险。",
  },
  {
    phase: "7. 质量验收",
    docType: "测试用例",
    tools: [
      { name: "飞书表格", href: "https://www.feishu.cn/hardcover/sheets" },
      { name: "墨刀演示", href: "https://modao.cc/", ai: true },
    ],
    description: "通过原型演示建立验收基准，并让 AI 从 PRD 自动生成关键测试路径。",
    highlights: ["墨刀"],
  },
  {
    phase: "8. 发布运营",
    docType: "更新日志 / 文案",
    tools: [
      { name: "ChatGPT", href: "https://chat.openai.com/", ai: true },
      { name: "Canva", href: "https://www.canva.cn/" },
    ],
    description: "把枯燥的技术修复转化为用户可感知、可传播的发布文案。",
  },
  {
    phase: "9. 复盘沉淀",
    docType: "数据复盘报告",
    tools: [
      { name: "SQL", href: "https://www.mysql.com/" },
      { name: "Mixpanel", href: "https://mixpanel.com/" },
      { name: "Metabase", href: "https://www.metabase.com/" },
    ],
    description: "让 AI 协助解释数据波动原因，定位链路中真正影响转化的环节。",
  },
];

function renderDescription(text: string, highlights?: string[]) {
  if (!highlights || highlights.length === 0) return text;

  let output: React.ReactNode[] = [text];

  for (const token of highlights) {
    const next: React.ReactNode[] = [];

    for (const part of output) {
      if (typeof part !== "string" || !part.includes(token)) {
        next.push(part);
        continue;
      }

      const pieces = part.split(token);
      pieces.forEach((piece, index) => {
        if (piece) next.push(piece);
        if (index < pieces.length - 1) {
          next.push(
            <span key={`${token}-${index}-${piece.length}`} className="tools-board-highlight">
              {token}
            </span>,
          );
        }
      });
    }

    output = next;
  }

  return output;
}

export function ToolsRecommendationBoard() {
  return (
    <section className="tools-board-shell">
      <div className="tools-board-grid">
        {TOOL_ROWS.map((row, index) => (
          <motion.article
            key={`${row.phase}-${row.docType}`}
            className="tools-board-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.03 }}
          >
            <div className="tools-board-meta">
              <span className="tools-board-phase">{row.phase}</span>
              <span className="tools-board-doc">{row.docType}</span>
            </div>

            <div className="tools-board-tags">
              {row.tools.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`tools-board-tag${tool.recommended ? " recommended" : ""}`}
                >
                  <span>{tool.recommended ? "★ " : ""}{tool.name}</span>
                  <span className="tools-board-tag-icons">
                    {tool.ai ? <span className="tools-board-ai">AI</span> : null}
                    <ExternalLink size={12} />
                  </span>
                </a>
              ))}
            </div>

            <p className="tools-board-desc">{renderDescription(row.description, row.highlights)}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
