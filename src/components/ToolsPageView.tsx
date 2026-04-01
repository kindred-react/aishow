"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Grid3X3, GitBranch, BookOpen } from "lucide-react";
import { AtlasRouteSwitch } from "@/components/AtlasRouteSwitch";
import { ToolsRecommendationBoard } from "@/components/ToolsRecommendationBoard";
import { WorkflowBoard } from "@/components/WorkflowBoard";
import { CasesTabView } from "@/components/CasesTabView";

type TabType = "matrix" | "workflow" | "cases";

const TAB_META: Record<TabType, { title: string; subtitle: string }> = {
  matrix: {
    title: "产品研发工具推荐矩阵",
    subtitle: "把规划、需求、原型、协作、验收与复盘串成一条可执行的 PM 工具链",
  },
  workflow: {
    title: "工作流",
    subtitle: "从规划到迭代，查看各角色在不同产品阶段的职责、交付物与推荐工具",
  },
  cases: {
    title: "案例中心",
    subtitle: "查看实际项目案例，了解产品生命周期各阶段的文档输出",
  },
};

const STORAGE_KEY = "tools-page-active-tab";

export function ToolsPageView() {
  const [activeTab, setActiveTab] = useState<TabType>("matrix" as TabType);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as TabType | null;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (stored && stored in TAB_META) setActiveTab(stored);
    /* eslint-enable react-hooks/set-state-in-effect */
    const timer = setTimeout(() => setIsMounted(true), 80);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEY, activeTab);
    }
  }, [activeTab, isMounted]);

  return (
    <main className={`page-shell${isMounted ? " mounted" : ""}`}>
      <div className="ambient" aria-hidden />
      <AtlasRouteSwitch title="产品研发工具推荐矩阵" />
      <section className="content-shell">
        <div className="content-body">
          <div className="content-scroll" style={{ padding: "0.2rem 0.1rem 0.4rem" }}>
            <div className="tools-tabs-container">
              <div className="tools-tabs-header">
                <div className="tools-tabs-titles">
                  <h2 className="tools-tabs-main-title">{TAB_META[activeTab].title}</h2>
                  <p className="tools-tabs-subtitle">{TAB_META[activeTab].subtitle}</p>
                </div>
                <div className="tools-tabs">
                  <button
                    className={`tools-tab${activeTab === "matrix" ? " active" : ""}`}
                    onClick={() => setActiveTab("matrix")}
                  >
                    <Grid3X3 size={16} />
                    <span>工具推荐矩阵</span>
                    {activeTab === "matrix" && (
                      <motion.div
                        className="tools-tab-indicator"
                        layoutId="toolsTabIndicator"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </button>
                  <button
                    className={`tools-tab${activeTab === "workflow" ? " active" : ""}`}
                    onClick={() => setActiveTab("workflow")}
                  >
                    <GitBranch size={16} />
                    <span>工作流</span>
                    {activeTab === "workflow" && (
                      <motion.div
                        className="tools-tab-indicator"
                        layoutId="toolsTabIndicator"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </button>
                  <button
                    className={`tools-tab${activeTab === "cases" ? " active" : ""}`}
                    onClick={() => setActiveTab("cases")}
                  >
                    <BookOpen size={16} />
                    <span>案例</span>
                    {activeTab === "cases" && (
                      <motion.div
                        className="tools-tab-indicator"
                        layoutId="toolsTabIndicator"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {activeTab === "matrix" && <ToolsRecommendationBoard />}
            {activeTab === "workflow" && <WorkflowBoard />}
            {activeTab === "cases" && <CasesTabView />}
          </div>
        </div>
      </section>
    </main>
  );
}
