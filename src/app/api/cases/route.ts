import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DOCUMENTS_DIR = path.join(process.cwd(), "public", "documents");

const LIFECYCLE_ICONS: Record<string, string> = {
  "01": "🔍",
  "02": "📋",
  "03": "🎨",
  "04": "⚙️",
  "05": "🔧",
  "06": "🚀",
  "07": "📊",
  "08": "🏁",
};

const LIFECYCLE_NAMES: Record<string, string> = {
  "01": "市场规划与调研",
  "02": "需求分析与定义",
  "03": "产品设计",
  "04": "技术架构",
  "05": "开发实现",
  "06": "测试验证",
  "07": "部署上线",
  "08": "运营迭代",
};

function getIconForFile(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("readme")) return "📖";
  if (lower.includes("prd") || lower.includes("需求")) return "📋";
  if (lower.includes("功能") || lower.includes("feature")) return "✨";
  if (lower.includes("mvp")) return "🎯";
  if (lower.includes("市场")) return "📈";
  if (lower.includes("用户研究") || lower.includes("用户报告")) return "👥";
  if (lower.includes("愿景") || lower.includes("vision")) return "🔮";
  if (lower.includes("分析") || lower.includes("报告")) return "📊";
  return "📄";
}

function getIconForFolder(foldername: string): string {
  return LIFECYCLE_ICONS[foldername.substring(0, 2)] || "📁";
}

function getFolderName(foldername: string): string {
  return LIFECYCLE_NAMES[foldername.substring(0, 2)] || foldername;
}

interface Doc {
  id: string;
  name: string;
  icon: string;
  docsPath: string;
}

interface Stage {
  id: string;
  name: string;
  icon: string;
  description: string;
  docs: Doc[];
}

interface CaseStudy {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  lifecycleStages: Stage[];
}

function readCaseFolder(casePath: string, caseName: string): CaseStudy | null {
  const entries = fs.readdirSync(casePath, { withFileTypes: true });

  const stages: Stage[] = [];
  let prdDoc: Doc | null = null;

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      if (entry.name.endsWith(".md")) {
        prdDoc = {
          id: `prd-${entry.name}`,
          name: entry.name.replace(".md", ""),
          icon: getIconForFile(entry.name),
          docsPath: `/documents/${caseName}/${entry.name}`,
        };
      }
      continue;
    }

    const stagePath = path.join(casePath, entry.name);
    const stageId = entry.name.substring(0, 2);
    const stageName = getFolderName(entry.name);
    const stageIcon = getIconForFolder(entry.name);

    const docs: Doc[] = [];
    const stageEntries = fs.readdirSync(stagePath, { withFileTypes: true });

    for (const docEntry of stageEntries) {
      if (docEntry.isFile() && docEntry.name.endsWith(".md")) {
        docs.push({
          id: `${stageId}-${docEntry.name}`,
          name: docEntry.name.replace(".md", ""),
          icon: getIconForFile(docEntry.name),
          docsPath: `/documents/${caseName}/${entry.name}/${docEntry.name}`,
        });
      }
    }

    if (docs.length > 0) {
      stages.push({
        id: stageId,
        name: stageName,
        icon: stageIcon,
        description: `${stageName}阶段文档`,
        docs,
      });
    }
  }

  const caseColors = [
    "#fe2c55",
    "#25f4ee",
    "#ff6b35",
    "#7b68ee",
    "#00d4aa",
    "#ffa500",
    "#e91e63",
    "#00bcd4",
  ];

  return {
    id: caseName,
    name: caseName,
    description: stages.length > 0 ? `案例项目: ${caseName}` : `案例项目: ${caseName}（暂无文档）`,
    icon: "📁",
    color: caseColors[0],
    lifecycleStages: stages,
  };
}

export async function GET() {
  try {
    if (!fs.existsSync(DOCUMENTS_DIR)) {
      return NextResponse.json({ cases: [] });
    }

    const entries = fs.readdirSync(DOCUMENTS_DIR, { withFileTypes: true });
    const cases: CaseStudy[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "manifest.json") continue;

      const casePath = path.join(DOCUMENTS_DIR, entry.name);
      const caseStudy = readCaseFolder(casePath, entry.name);

      if (caseStudy) {
        cases.push(caseStudy);
      }
    }

    return NextResponse.json({ cases });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read documents directory" },
      { status: 500 }
    );
  }
}