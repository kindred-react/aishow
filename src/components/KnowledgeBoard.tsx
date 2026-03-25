"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Compass,
  FileText,
  PackageSearch,
  Rocket,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useRef, useMemo, useState } from "react";
import { learningModules } from "@/data/knowledge";

const levelOrder = ["基础", "进阶", "实战"] as const;

type DimensionTab = "overview" | "knowledge" | "operation" | "tools" | "cases";
type KnowledgeLevelFilter = "全部" | (typeof levelOrder)[number];

export function KnowledgeBoard() {
  const [activeModuleId, setActiveModuleId] = useState(learningModules[0]?.id ?? "");
  const [activeDimension, setActiveDimension] = useState<DimensionTab>("overview");
  const [levelFilter, setLevelFilter] = useState<KnowledgeLevelFilter>("全部");
  const [highlightOpId, setHighlightOpId] = useState<string | null>(null);
  const opRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const activeModule = useMemo(
    () => learningModules.find((m) => m.id === activeModuleId) ?? learningModules[0],
    [activeModuleId],
  );

  const moduleTools = useMemo(() => {
    if (!activeModule) return [];

    const counter = new Map<string, number>();
    activeModule.operationSteps.forEach((step) => {
      step.tools.forEach((tool) => {
        counter.set(tool, (counter.get(tool) ?? 0) + 1);
      });
    });

    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [activeModule]);

  const visibleKnowledge = useMemo(() => {
    if (!activeModule) return [];
    if (levelFilter === "全部") return activeModule.knowledgeNodes;
    return activeModule.knowledgeNodes.filter((item) => item.level === levelFilter);
  }, [activeModule, levelFilter]);

  const tocItems = useMemo(() => {
    if (!activeModule) return [];
    if (activeDimension === "knowledge") return visibleKnowledge.map((n) => ({ id: n.id, label: n.title }));
    if (activeDimension === "operation") return activeModule.operationSteps.map((s) => ({ id: s.id, label: s.title }));
    if (activeDimension === "cases") return (activeModule.cases ?? []).map((c) => ({ id: c.id, label: c.title }));
    if (activeDimension === "tools") return moduleTools.map((t) => ({ id: t.name, label: t.name }));
    return [];
  }, [activeDimension, activeModule, visibleKnowledge, moduleTools]);

  function scrollToId(id: string) {
    const el = document.getElementById(`item-${id}`);
    if (el && scrollRef.current) {
      scrollRef.current.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
    }
  }

  function jumpToOp(opId: string) {
    setActiveDimension("operation");
    setHighlightOpId(opId);
    setTimeout(() => {
      const el = opRefs.current[opId];
      if (el && scrollRef.current) {
        scrollRef.current.scrollTo({ top: (el as HTMLElement).offsetTop - 12, behavior: "smooth" });
      }
      setTimeout(() => setHighlightOpId(null), 1800);
    }, 80);
  }

  if (!activeModule) return null;

  const dimensions: { key: DimensionTab; label: string }[] = [
    { key: "overview", label: "模块总览" },
    { key: "knowledge", label: "知识点" },
    { key: "operation", label: "操作点" },
    { key: "tools", label: "工具" },
    { key: "cases", label: "案例" },
  ];

  return (
    <main className="page-shell">
      <div className="ambient" aria-hidden />

      <header className="hero compact">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="hero-badge"
        >
          <Sparkles size={14} />
          AI Learning Atlas
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.4 }}
        >
          大模型多维知识中枢
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          用你说的方式：模块菜单 + 维度 Tab，清晰切换，不做复杂表格干扰。
        </motion.p>
      </header>

      <section className="content-shell">
        <nav className="module-menu" aria-label="学习模块菜单">
          {learningModules.map((module) => (
            <button
              key={module.id}
              type="button"
              className={`module-btn ${activeModuleId === module.id ? "active" : ""}`}
              onClick={() => { setActiveModuleId(module.id); setActiveDimension("overview"); }}
            >
              {module.name}
            </button>
          ))}
        </nav>

        <div className="content-toolbar">
          <div className="module-summary">
            <PackageSearch size={15} />
            <strong>{activeModule.name}</strong>
            <span>{activeModule.intro}</span>
          </div>

          <div className="dimension-menu" aria-label="维度切换">
            {dimensions.map((d) => (
              <button
                key={d.key}
                type="button"
                className={`dimension-btn ${activeDimension === d.key ? "active" : ""}`}
                onClick={() => setActiveDimension(d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="content-body">
          <div className="content-scroll" ref={scrollRef}>
          {activeDimension === "overview" && (
            <section className="section-block in-shell">
              <div className="section-title-row">
                <BookOpen size={17} />
                <h2>模块总览</h2>
              </div>
              <div className="metric-grid">
                <article className="overview-card">
                  <strong>{activeModule.knowledgeNodes.length}</strong>
                  <span>知识点数量</span>
                </article>
                <article className="overview-card">
                  <strong>{activeModule.operationSteps.length}</strong>
                  <span>操作步骤数量</span>
                </article>
                <article className="overview-card">
                  <strong>{moduleTools.length}</strong>
                  <span>涉及工具数量</span>
                </article>
              </div>
              <p className="overview-note">
                推荐先看“知识点维度”建立概念，再切“操作点维度”做落地练习，最后在“工具维度”补齐工具链。
              </p>
            </section>
          )}

          {activeDimension === "knowledge" && (
            <section className="section-block in-shell">
              <div className="section-title-row">
                <BrainCircuit size={17} />
                <h2>知识点维度</h2>
              </div>

              <div className="sub-filter">
                {(["全部", ...levelOrder] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`sub-filter-btn ${levelFilter === item ? "active" : ""}`}
                    onClick={() => setLevelFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="cards knowledge-dense-grid">
                {visibleKnowledge.map((node) => (
                  <article key={node.id} id={`item-${node.id}`} className="concept-card">
                    <div className="card-top" style={{ borderColor: node.color }}>
                      <strong>{node.title}</strong>
                      <span>{node.level} · {node.metaphor}</span>
                    </div>
                    <p>{node.summary}</p>
                    <ul>
                      {node.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                    {node.relatedOps && node.relatedOps.length > 0 && (
                      <div className="related-ops">
                        {node.relatedOps.map((opId) => {
                          const op = activeModule.operationSteps.find((s) => s.id === opId);
                          if (!op) return null;
                          return (
                            <button key={opId} type="button" className="related-op-btn"
                              onClick={() => jumpToOp(opId)}
                            >
                              <ArrowRight size={11} /> {op.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeDimension === "operation" && (
            <section className="section-block in-shell">
              <div className="section-title-row">
                <Rocket size={17} />
                <h2>操作点维度</h2>
              </div>

              <div className="timeline">
                {activeModule.operationSteps.map((step, idx) => (
                  <article
                    key={step.id}
                    id={`item-${step.id}`}
                    ref={(el) => { opRefs.current[step.id] = el; }}
                    className={`timeline-item ${highlightOpId === step.id ? "highlighted" : ""}`}
                  >
                    <div className="timeline-index">0{idx + 1}</div>
                    <div className="timeline-content">
                      <h4>{step.title}</h4>
                      <p className="target">目标：{step.target}</p>
                      <p>{step.detail}</p>
                      <div className="tool-tags">
                        {step.tools.map((tool) => (
                          <span key={tool}>{tool}</span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeDimension === "tools" && (
            <section className="section-block in-shell">
              <div className="section-title-row"><Wrench size={17} /><h2>工具维度</h2></div>
              <div className="tool-heat-grid">
                {moduleTools.map((tool) => (
                  <article key={tool.name} id={`item-${tool.name}`} className="tool-heat-card">
                    <strong>{tool.name}</strong>
                    <span>在本模块出现 {tool.count} 次</span>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeDimension === "cases" && (
            <section className="section-block in-shell">
              <div className="section-title-row"><FileText size={17} /><h2>真实案例</h2></div>
              <div className="cases-grid">
                {(activeModule.cases ?? []).map((c) => (
                  <article key={c.id} id={`item-${c.id}`} className="case-card">
                    <h4>{c.title}</h4>
                    <div className="case-row"><em>场景</em><span>{c.scene}</span></div>
                    <div className="case-row"><em>问题</em><span>{c.problem}</span></div>
                    <div className="case-row"><em>方案</em><span>{c.solution}</span></div>
                    <div className="case-row result"><em>结果</em><span>{c.result}</span></div>
                    <div className="tool-tags">{c.tags.map((t) => <span key={t}>{t}</span>)}</div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        {tocItems.length > 0 && (
          <nav className="toc-sidebar" aria-label="目录导航">
            <p className="toc-title">目录</p>
            {tocItems.map((item) => (
              <button key={item.id} type="button" className="toc-btn"
                onClick={() => scrollToId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
        </div>
      </section>

      <footer className="footer-note compact">
        <Compass size={15} />
        现在是“模块 + 菜单 + Tab”多维展示结构，后续可再加“案例维度”。
      </footer>
    </main>
  );
}
