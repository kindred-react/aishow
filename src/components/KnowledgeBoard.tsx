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
import { useRef, useMemo, useState, useEffect } from "react";
import { learningModules } from "@/data/knowledge";
import { AgentPatternCompare } from "@/components/AgentPatternCompare";
import { MLAlgorithmCompare } from "@/components/MLAlgorithmCompare";
import { AgentFrameworkCompare } from "@/components/AgentFrameworkCompare";
import { InterviewPanel } from "@/components/InterviewPanel";

const levelOrder = ["基础", "进阶", "实战"] as const;
const sortedModules = [...learningModules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

type DimensionTab = "knowledge" | "operation" | "skills" | "path" | "interview" | "career" | "tools" | "cases";
type KnowledgeLevelFilter = "全部" | (typeof levelOrder)[number];

export function KnowledgeBoard() {
  const [activeModuleId, setActiveModuleId] = useState(sortedModules[0]?.id ?? "");
  const [activeDimension, setActiveDimension] = useState<DimensionTab>("knowledge");
  const [levelFilter, setLevelFilter] = useState<KnowledgeLevelFilter>("全部");
  const [highlightOpId, setHighlightOpId] = useState<string | null>(null);
  const opRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Restore localStorage state after hydration
  useEffect(() => {
    const savedModule = localStorage.getItem("kb-module");
    const savedDimension = localStorage.getItem("kb-dimension") as DimensionTab | null;
    const savedLevel = localStorage.getItem("kb-level") as KnowledgeLevelFilter | null;
    if (savedModule && sortedModules.find((m) => m.id === savedModule)) setActiveModuleId(savedModule);
    if (savedDimension && ["knowledge","operation","skills","path","interview","career","tools","cases"].includes(savedDimension)) setActiveDimension(savedDimension);
    if (savedLevel && ["全部","基础","进阶","实战"].includes(savedLevel)) setLevelFilter(savedLevel);
  }, []);

  // Persist to localStorage on change
  useEffect(() => { localStorage.setItem("kb-module", activeModuleId); }, [activeModuleId]);
  useEffect(() => { localStorage.setItem("kb-dimension", activeDimension); }, [activeDimension]);
  useEffect(() => { localStorage.setItem("kb-level", levelFilter); }, [levelFilter]);

  const activeModule = useMemo(
    () => sortedModules.find((m) => m.id === activeModuleId) ?? sortedModules[0],
    [activeModuleId],
  );

  const moduleTools = useMemo(() => {
    if (!activeModule) return [];
    const counter = new Map<string, number>();
    activeModule.operationSteps.forEach((step) => {
      step.tools.forEach((tool) => { counter.set(tool, (counter.get(tool) ?? 0) + 1); });
    });
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
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
    if (activeDimension === "skills") return (activeModule.skills ?? []).map((s) => ({ id: s.id, label: s.name }));
    if (activeDimension === "path") return (activeModule.learningPath ?? []).map((p) => ({ id: p.id, label: p.title }));
    if (activeDimension === "interview") return (activeModule.interviewQuestions ?? []).map((q) => ({ id: q.id, label: q.question.slice(0, 18) + (q.question.length > 18 ? "…" : "") }));
    if (activeDimension === "career") return (activeModule.careerPlan ?? []).map((c) => ({ id: c.id, label: c.week + " " + c.phase }));
    return [];
  }, [activeDimension, activeModule, visibleKnowledge, moduleTools]);

  function scrollToId(id: string) {
    const el = document.getElementById(`item-${id}`);
    if (el && scrollRef.current) scrollRef.current.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
  }

  function jumpToOp(opId: string) {
    setActiveDimension("operation");
    setHighlightOpId(opId);
    setTimeout(() => {
      const el = opRefs.current[opId];
      if (el && scrollRef.current) scrollRef.current.scrollTo({ top: (el as HTMLElement).offsetTop - 12, behavior: "smooth" });
      setTimeout(() => setHighlightOpId(null), 1800);
    }, 80);
  }

  if (!activeModule) return null;

  const dimensions: { key: DimensionTab; label: string }[] = [
    { key: "knowledge", label: "知识点" },
    { key: "operation", label: "操作点" },
    { key: "skills", label: "能力雷达" },
    { key: "path", label: "成长路径" },
    { key: "interview", label: "面试准备" },
    { key: "career", label: "职业规划" },
    { key: "tools", label: "工具" },
    { key: "cases", label: "案例" },
  ];

  return (
    <main className="page-shell">
      <div className="ambient" aria-hidden />
      <header className="hero compact">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="hero-badge">
          <Sparkles size={14} /> AI Learning Atlas
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.4 }}>
          大模型多维知识中枢
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          8 大模块覆盖：基础理论 → RAG → 微调 → 测评 → 部署 → Agent → 新兴应用 → 项目落地
        </motion.p>
      </header>

      <section className="content-shell">
        <nav className="module-menu" aria-label="学习模块菜单">
          {sortedModules.map((module) => (
            <button key={module.id} type="button"
              className={`module-btn ${activeModuleId === module.id ? "active" : ""}`}
              onClick={() => { setActiveModuleId(module.id); setActiveDimension("knowledge"); setLevelFilter("全部"); }}
            >
              <span className="module-icon">{module.icon}</span>{module.name}
            </button>
          ))}
        </nav>

        <div className="content-toolbar">
          <div className="module-summary-inline">
            <span className="module-summary-icon">{activeModule.icon}</span>
            <strong>{activeModule.name}</strong>
            <span className="module-summary-divider">·</span>
            <span className="module-summary-intro">{activeModule.intro}</span>
            <span className="module-summary-stats">
              {activeModule.knowledgeNodes.length} 知识点
              · {activeModule.operationSteps.length} 操作点
              · {moduleTools.length} 工具
              · {activeModule.cases?.length ?? 0} 案例
            </span>
          </div>
          <div className="dimension-menu" aria-label="维度切换">
            {dimensions.map((d) => (
              <button key={d.key} type="button"
                className={`dimension-btn ${activeDimension === d.key ? "active" : ""}`}
                onClick={() => setActiveDimension(d.key)}
              >{d.label}</button>
            ))}
          </div>
        </div>

        <div className="content-body">
          <div className="content-scroll" ref={scrollRef}>

            {activeDimension === "knowledge" && (
              <section className="section-block in-shell">
                <div className="section-title-row"><BrainCircuit size={17} /><h2>知识点维度</h2></div>
                <div className="sub-filter">
                  {(["全部", ...levelOrder] as const).map((item) => (
                    <button key={item} type="button"
                      className={`sub-filter-btn ${levelFilter === item ? "active" : ""}`}
                      onClick={() => setLevelFilter(item)}
                    >{item}</button>
                  ))}
                </div>
                {activeModule.id === "agent" && (
                  <div style={{ marginBottom: "1.2rem" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-violet)", marginBottom: "0.5rem", fontWeight: 600 }}>5种Agent模式对比</p>
                    <AgentPatternCompare />
                    <p style={{ fontSize: "0.8rem", color: "var(--c-neon)", marginBottom: "0.5rem", marginTop: "1rem", fontWeight: 600 }}>8种主流Agent框架 + MCP集成代码</p>
                    <AgentFrameworkCompare />
                  </div>
                )}
                {activeModule.id === "foundations" && (
                  <div style={{ marginBottom: "1.2rem" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--c-cyan)", marginBottom: "0.5rem", fontWeight: 600 }}>6个机器学习核心算法对比</p>
                    <MLAlgorithmCompare />
                  </div>
                )}
                <div className="cards knowledge-dense-grid">
                  {visibleKnowledge.map((node) => (
                    <article key={node.id} id={`item-${node.id}`} className="concept-card">
                      <div className="card-top" style={{ borderColor: node.color }}>
                        <strong>{node.title}</strong>
                        <span>{node.level} · {node.metaphor}</span>
                      </div>
                      <p>{node.summary}</p>
                      <ul>{node.points.map((point) => <li key={point}>{point}</li>)}</ul>
                      {node.imageUrl && (
                        <div className="knowledge-img"><img src={node.imageUrl} alt={node.title} loading="lazy" /></div>
                      )}
                      {(node.source || node.updatedAt) && (
                        <div className="knowledge-meta">
                          {node.source && <span className="meta-source">来源：{node.source}</span>}
                          {node.updatedAt && <span className="meta-date">{node.updatedAt}</span>}
                          {node.version && node.version > 1 && <span className="meta-version">v{node.version}</span>}
                        </div>
                      )}
                      {node.relatedOps && node.relatedOps.length > 0 && (
                        <div className="related-ops">
                          {node.relatedOps.map((opId) => {
                            const op = activeModule.operationSteps.find((s) => s.id === opId);
                            if (!op) return null;
                            return (
                              <button key={opId} type="button" className="related-op-btn" onClick={() => jumpToOp(opId)}>
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
                <div className="section-title-row"><Rocket size={17} /><h2>操作点维度</h2></div>
                <div className="timeline">
                  {activeModule.operationSteps.map((step, idx) => (
                    <article key={step.id} id={`item-${step.id}`}
                      ref={(el) => { opRefs.current[step.id] = el; }}
                      className={`timeline-item ${highlightOpId === step.id ? "highlighted" : ""}`}
                    >
                      <div className="timeline-index">0{idx + 1}</div>
                      <div className="timeline-content">
                        <h4>{step.title}</h4>
                        <p className="target">目标：{step.target}</p>
                        <p>{step.detail}</p>
                        <div className="tool-tags">{step.tools.map((tool) => <span key={tool}>{tool}</span>)}</div>
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

            {activeDimension === "skills" && (
              <section className="section-block in-shell">
                <div className="section-title-row"><BrainCircuit size={17} /><h2>能力雷达</h2></div>
                {(activeModule.skills ?? []).length === 0 && (
                  <p className="empty-hint">本模块暂未配置能力要求</p>
                )}
                <div className="skills-grid">
                  {(activeModule.skills ?? []).map((skill) => (
                    <article key={skill.id} id={`item-${skill.id}`} className="skill-card">
                      <div className="skill-header">
                        <span className="skill-dimension">{skill.dimension}</span>
                        <strong>{skill.name}</strong>
                        <div className="skill-level-bar">
                          {[1,2,3,4,5].map((n) => (
                            <span key={n} className={`skill-dot ${n <= skill.level ? "filled" : ""}`} />
                          ))}
                        </div>
                      </div>
                      <p className="skill-desc">{skill.description}</p>
                      <div className="skill-howto">
                        <span className="skill-howto-label">如何提升</span>
                        <ul>{skill.howTo.map((h) => <li key={h}>{h}</li>)}</ul>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeDimension === "path" && (
              <section className="section-block in-shell">
                <div className="section-title-row"><Rocket size={17} /><h2>成长路径</h2></div>
                {(activeModule.learningPath ?? []).length === 0 && (
                  <p className="empty-hint">本模块暂未配置学习路径</p>
                )}
                <div className="learning-path">
                  {(activeModule.learningPath ?? []).map((node, idx) => (
                    <article key={node.id} id={`item-${node.id}`} className={`path-node path-${node.level}`}>
                      <div className="path-index">{String(idx + 1).padStart(2, "0")}</div>
                      <div className="path-content">
                        <div className="path-header">
                          <strong>{node.title}</strong>
                          <span className="path-level-badge">{node.level}</span>
                          {node.estimatedHours && (
                            <span className="path-hours">≈ {node.estimatedHours}h</span>
                          )}
                        </div>
                        {node.prerequisite && node.prerequisite.length > 0 && (
                          <span className="path-prereq">前置：{node.prerequisite.map(pid => {
                            const found = activeModule.learningPath?.find(p => p.id === pid);
                            return found?.title ?? pid;
                          }).join(" / ")}</span>
                        )}
                        {node.tip && <p className="path-tip">💡 {node.tip}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeDimension === "interview" && (
              <section className="section-block in-shell">
                <div className="section-title-row"><FileText size={17} /><h2>面试准备 <span style={{fontSize:"0.75rem",color:"var(--c-neon)",marginLeft:"0.5rem"}}>{activeModule.interviewQuestions?.length ?? 0} 题</span></h2></div>
                {(activeModule.interviewQuestions ?? []).length === 0
                  ? <p className="empty-hint">本模块暂未配置面试题</p>
                  : <InterviewPanel questions={activeModule.interviewQuestions ?? []} />
                }
              </section>
            )}

            {activeDimension === "career" && (
              <section className="section-block in-shell">
                <div className="section-title-row"><Compass size={17} /><h2>15天职业规划</h2></div>
                {(activeModule.careerPlan ?? []).length === 0 && (
                  <p className="empty-hint">本模块暂未配置职业规划</p>
                )}
                <div className="career-timeline">
                  {(activeModule.careerPlan ?? []).map((m, idx) => (
                    <article key={m.id} id={`item-${m.id}`} className="career-card">
                      <div className="career-week">
                        <span className="career-week-label">{m.week}</span>
                        <span className="career-phase">{m.phase}</span>
                      </div>
                      <div className="career-body">
                        <p className="career-goal">🎯 {m.goal}</p>
                        <ul className="career-actions">
                          {m.actions.map((a) => <li key={a}>{a}</li>)}
                        </ul>
                        <div className="career-footer">
                          <span className="career-deliverable">📦 交付物：{m.deliverable}</span>
                          <span className="career-check">✅ 验收：{m.checkPoint}</span>
                        </div>
                        {m.resources && m.resources.length > 0 && (
                          <div className="career-resources">
                            {m.resources.map((r) => <span key={r}>{r}</span>)}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

          </div>

          {tocItems.length > 0 && (
            <nav className="toc-sidebar" aria-label="目录导航">
              <p className="toc-title">目录</p>
              {tocItems.map((item, idx) => (
                <button key={item.id} type="button" className="toc-btn" title={item.label} onClick={() => scrollToId(item.id)}>
                  <span className="toc-btn-idx">{idx + 1}</span>{item.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </section>

      <footer className="footer-note compact">
        <Compass size={15} />
        知识可持续沉淀：新增 PPT/PDF 经 AI 分析后按模块写入，支持去重、补充、更新三种合并策略。
      </footer>
    </main>
  );
}
