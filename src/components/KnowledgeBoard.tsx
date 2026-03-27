"use client";
/* eslint-disable react-hooks/preserve-manual-memoization */

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Compass,
  FileText,
  Rocket,
  Sparkles,
  Wrench,
  PenLine,
  Trash2,
  Lock,
  LockOpen,
  X,
  Plus,
} from "lucide-react";
import { useRef, useMemo, useState, useEffect } from "react";
import { KnowledgeCard } from "@/components/NoteEditor";
import { NodeEditorModal } from "@/components/NodeEditor";
import { ModuleEditorModal, AddModuleButton } from "@/components/ModuleEditor";
import { ImageCleanupModal } from "@/components/ImageCleanup";
import { AgentPatternCompare } from "@/components/AgentPatternCompare";
import { MLAlgorithmCompare } from "@/components/MLAlgorithmCompare";
import { AgentFrameworkCompare } from "@/components/AgentFrameworkCompare";
import { CompareBlockView, CompareBlockEditor } from "@/components/CompareBlockEditor";
import { InterviewPanel } from "@/components/InterviewPanel";
import { TabItemEditor } from "@/components/TabItemEditor";
import type { TabItemType } from "@/components/TabItemEditor";
import { useContentStore } from "@/lib/useContentStore";
import { useEditMode } from "@/lib/useEditMode";
import type { KnowledgeNode, LearningModule, CompareBlock, OperationStep, CaseStudy, SkillItem, LearningPathNode, InterviewQuestion, CareerMilestone, ToolItem } from "@/data/types";

// ── Standalone compare block list (avoids React Compiler memoization issue) ──
function CompareBlockList({
  blocks, moduleId, dimensionTab, isEditMode,
  onEdit, onDelete,
}: {
  blocks: CompareBlock[];
  moduleId: string;
  dimensionTab: string;
  isEditMode: boolean;
  onEdit: (block: CompareBlock) => void;
  onDelete: (id: string) => void;
}) {
  const filtered = blocks
    .filter(b => b.moduleId === moduleId && b.dimensionTab === dimensionTab)
    .sort((a, b) => a.order - b.order);
  if (filtered.length === 0) return null;
  return (
    <>
      {filtered.map(block => (
        <div key={block.id} style={{ marginBottom: "1rem" }}>
          <CompareBlockView
            block={block}
            onEdit={isEditMode ? () => onEdit(block) : undefined}
            onDelete={isEditMode ? () => onDelete(block.id) : undefined}
          />
        </div>
      ))}
    </>
  );
}

const levelOrder = ["基础", "进阶", "实战"] as const;

type DimensionTab = "knowledge" | "operation" | "skills" | "path" | "interview" | "career" | "tools" | "cases";
type KnowledgeLevelFilter = "全部" | (typeof levelOrder)[number];

export function KnowledgeBoard() {
  const { mergedModules, deleteNode, addNode, editNode, addModule, deleteModule, editModule, addCompareBlock, editCompareBlock, deleteCompareBlock, addOperation, editOperation, deleteOperation, addCase, editCase, deleteCase, addSkill, editSkill, deleteSkill, addPathNode, editPathNode, deletePathNode, addInterview, editInterview, deleteInterview, addCareer, editCareer, deleteCareer, addTool, editTool, deleteTool, store, syncStatus, syncMsg } = useContentStore();
  const { isEditMode, showPrompt, input, setInput, error, requestEdit, submitPassword, cancelPrompt } = useEditMode();

  const sortedModules = useMemo(
    () => [...mergedModules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [mergedModules]
  );

  const [activeModuleId, setActiveModuleId] = useState<string>("");
  const [activeDimension, setActiveDimension] = useState<DimensionTab>("knowledge");
  const [levelFilter, setLevelFilter] = useState<KnowledgeLevelFilter>("全部");
  const [isMounted, setIsMounted] = useState(false);

  // Restore from localStorage after hydration (must be after mount to avoid SSR mismatch)
  useEffect(() => {
    const savedModule = localStorage.getItem("kb-module");
    const savedDimension = localStorage.getItem("kb-dimension") as DimensionTab | null;
    const savedLevel = localStorage.getItem("kb-level") as KnowledgeLevelFilter | null;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (savedModule) setActiveModuleId(savedModule);
    if (savedDimension && ["knowledge","operation","skills","path","interview","career","tools","cases"].includes(savedDimension)) setActiveDimension(savedDimension);
    if (savedLevel && ["全部","基础","进阶","实战"].includes(savedLevel)) setLevelFilter(savedLevel);
    /* eslint-enable react-hooks/set-state-in-effect */
    // Small delay so state settles before revealing UI (prevents jump)
    setTimeout(() => setIsMounted(true), 80);
  }, []);
  const [highlightOpId, setHighlightOpId] = useState<string | null>(null);
  const [nodeModal, setNodeModal] = useState<{ open: boolean; node: KnowledgeNode | null; moduleId: string }>({ open: false, node: null, moduleId: "" });
  const [moduleModal, setModuleModal] = useState<{ open: boolean; module: LearningModule | null }>({ open: false, module: null });
  const [showImageCleanup, setShowImageCleanup] = useState(false);
  const [compareModal, setCompareModal] = useState<{ open: boolean; block: CompareBlock | null; dimensionTab: string }>({ open: false, block: null, dimensionTab: "knowledge" });
  const [ctxMenu, setCtxMenu] = useState<{ moduleId: string; x: number; y: number } | null>(null);

  // Block page refresh/close when in edit mode with unsaved local changes
  useEffect(() => {
    const hasChanges = (
      Object.keys(store.nodeEdits).length > 0 ||
      Object.values(store.addedNodes).some(a => a.length > 0) ||
      store.deletedNodes.length > 0 ||
      Object.values(store.addedOperations).some(a => a.length > 0) ||
      Object.keys(store.editedOperations).length > 0 ||
      Object.values(store.addedCases).some(a => a.length > 0) ||
      Object.keys(store.editedCases).length > 0 ||
      Object.values(store.addedSkills).some(a => a.length > 0) ||
      Object.values(store.addedPathNodes).some(a => a.length > 0) ||
      Object.values(store.addedInterviews).some(a => a.length > 0) ||
      Object.values(store.addedCareer).some(a => a.length > 0) ||
      Object.values(store.addedTools).some(a => a.length > 0) ||
      store.addedModules.length > 0 ||
      store.deletedModules.length > 0 ||
      store.compareBlocks.length > 0
    );
    if (!isEditMode || !hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditMode, store]);

  // Close context menu on outside click — delayed to avoid same-event close
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    const timer = setTimeout(() => {
      window.addEventListener("click", close, { once: true });
      window.addEventListener("contextmenu", close, { once: true });
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [ctxMenu]);

  type AnyTabItem = OperationStep | CaseStudy | SkillItem | LearningPathNode | InterviewQuestion | CareerMilestone | ToolItem;
  const [tabItemModal, setTabItemModal] = useState<{ open: boolean; tab: TabItemType; item: AnyTabItem | null }>({ open: false, tab: "operation", item: null });
  const openTabItemModal = (tab: TabItemType, item: AnyTabItem | null = null) => setTabItemModal({ open: true, tab, item });
  const closeTabItemModal = () => setTabItemModal(prev => ({ ...prev, open: false }));

  const handleTabItemSave = (tab: TabItemType, saved: AnyTabItem) => {
    const mid = activeModule.id;
    const isNew = !tabItemModal.item;
    if (tab === "operation") { if (isNew) addOperation(mid, saved as OperationStep); else editOperation(saved.id, saved as OperationStep); }
    else if (tab === "cases")     { if (isNew) addCase(mid, saved as CaseStudy);          else editCase(saved.id, saved as CaseStudy); }
    else if (tab === "skills")    { if (isNew) addSkill(mid, saved as SkillItem);         else editSkill(saved.id, saved as SkillItem); }
    else if (tab === "path")      { if (isNew) addPathNode(mid, saved as LearningPathNode); else editPathNode(saved.id, saved as LearningPathNode); }
    else if (tab === "interview") { if (isNew) addInterview(mid, saved as InterviewQuestion); else editInterview(saved.id, saved as InterviewQuestion); }
    else if (tab === "career")    { if (isNew) addCareer(mid, saved as CareerMilestone);   else editCareer(saved.id, saved as CareerMilestone); }
    else if (tab === "tools")     { if (isNew) addTool(mid, saved as ToolItem);            else editTool(saved.id, saved as ToolItem); }
  };

  const handleTabItemDelete = (tab: TabItemType, id: string) => {
    const mid = activeModule.id;
    if (tab === "operation") deleteOperation(mid, id);
    else if (tab === "cases")     deleteCase(mid, id);
    else if (tab === "skills")    deleteSkill(mid, id);
    else if (tab === "path")      deletePathNode(mid, id);
    else if (tab === "interview") deleteInterview(mid, id);
    else if (tab === "career")    deleteCareer(mid, id);
    else if (tab === "tools")     deleteTool(mid, id);
  };

  // Helper: open compare modal for a given tab
  const openCompareModal = (tab: string, block: CompareBlock | null = null) =>
    setCompareModal({ open: true, block, dimensionTab: tab });
  const opRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Persist to localStorage on change
  useEffect(() => { localStorage.setItem("kb-module", activeModuleId); }, [activeModuleId]);
  useEffect(() => { localStorage.setItem("kb-dimension", activeDimension); }, [activeDimension]);
  useEffect(() => { localStorage.setItem("kb-level", levelFilter); }, [levelFilter]);

   
  const activeModule = useMemo(
    () => sortedModules.find((m) => m.id === activeModuleId) ?? sortedModules[0],
    [activeModuleId, sortedModules]
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
    <main className={`page-shell${isMounted ? " mounted" : ""}`}>
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
            <div key={module.id} className="module-btn-wrap">
              <button type="button"
                className={`module-btn ${activeModuleId === module.id ? "active" : ""}`}
                onClick={() => { setActiveModuleId(module.id); setActiveDimension("knowledge"); setLevelFilter("全部"); }}
                onContextMenu={isEditMode ? (e) => { e.preventDefault(); setCtxMenu({ moduleId: module.id, x: e.clientX, y: e.clientY }); } : undefined}
              >
                <span className="module-icon">{module.icon}</span>{module.name}
              </button>
            </div>
          ))}
          {isEditMode && <AddModuleButton onClick={() => setModuleModal({ open: true, module: null })} />}
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
                <div className="section-title-row">
                  <BrainCircuit size={17} /><h2>知识点维度</h2>
                  {isEditMode && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => setNodeModal({ open: true, node: null, moduleId: activeModule.id })}>
                        <Plus size={13} /> 新增知识点
                      </button>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal("knowledge")}>
                        <Plus size={13} /> 新增对比组件
                      </button>
                    </div>
                  )}
                </div>
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

                {/* ── Custom compare blocks for this module ── */}
                <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab="knowledge" isEditMode={isEditMode} onEdit={(b) => openCompareModal("knowledge", b)} onDelete={deleteCompareBlock} />

                <div className="cards knowledge-dense-grid">
                  {visibleKnowledge.map((rawNode) => (
                    <KnowledgeCard
                      key={rawNode.id}
                      rawNode={rawNode}
                      operationSteps={activeModule.operationSteps}
                      onJumpToOp={jumpToOp}
                      onEdit={isEditMode ? (node) => setNodeModal({ open: true, node, moduleId: activeModule.id }) : undefined}
                      onDelete={isEditMode ? (nodeId) => deleteNode(activeModule.id, nodeId) : undefined}
                    />
                  ))}
                </div>
                {isEditMode && (<></>)}
              </section>
            )}

            {activeDimension === "operation" && (
              <section className="section-block in-shell">
                <div className="section-title-row">
                  <Rocket size={17} /><h2>操作点维度</h2>
                  {isEditMode && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("operation")}>
                        <Plus size={13} /> 新增操作步骤
                      </button>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal("operation")}>
                        <Plus size={13} /> 新增对比组件
                      </button>
                    </div>
                  )}
                </div>
                <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab="operation" isEditMode={isEditMode} onEdit={(b) => openCompareModal("operation", b)} onDelete={deleteCompareBlock} />
                <div className="timeline">
                  {activeModule.operationSteps.map((step, idx) => (
                    <article key={step.id} id={`item-${step.id}`}
                      ref={(el) => { opRefs.current[step.id] = el; }}
                      className={`timeline-item ${highlightOpId === step.id ? "highlighted" : ""}`}
                    >
                      <div className="timeline-index">0{idx + 1}</div>
                      <div className="timeline-content">
                        <div className="card-edit-row">
                          <h4>{step.title}</h4>
                          {isEditMode && (
                            <div className="card-edit-btns">
                              <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("operation", step)}><PenLine size={11}/></button>
                              <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除此操作步骤？")) deleteOperation(activeModule.id, step.id); }}><Trash2 size={11}/></button>
                            </div>
                          )}
                        </div>
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
                <div className="section-title-row">
                  <Wrench size={17} /><h2>工具维度</h2>
                  {isEditMode && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("tools")}>
                        <Plus size={13} /> 新增工具
                      </button>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal("tools")}>
                        <Plus size={13} /> 新增对比组件
                      </button>
                    </div>
                  )}
                </div>
                <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab="tools" isEditMode={isEditMode} onEdit={(b) => openCompareModal("tools", b)} onDelete={deleteCompareBlock} />
                {(activeModule.tools ?? []).length === 0 && (
                  <p className="empty-hint">本模块暂未配置工具，点击「新增工具」添加</p>
                )}
                <div className="tool-heat-grid">
                  {(activeModule.tools ?? []).map((tool) => (
                    <article key={tool.id} id={`item-${tool.id}`} className="tool-heat-card">
                      <div className="card-edit-row">
                        <strong>{tool.name}</strong>
                        {isEditMode && (
                          <div className="card-edit-btns">
                            <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("tools", tool)}><PenLine size={11}/></button>
                            <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除此工具？")) deleteTool(activeModule.id, tool.id); }}><Trash2 size={11}/></button>
                          </div>
                        )}
                      </div>
                      <span className="tool-category">{tool.category}{tool.isPaid ? " · 付费" : " · 免费"}</span>
                      {tool.description && <p style={{fontSize:"0.75rem",color:"#8aa0c8",margin:"0.3rem 0 0"}}>{tool.description}</p>}
                      {tool.url && <a href={tool.url} target="_blank" rel="noreferrer" style={{fontSize:"0.7rem",color:"var(--c-neon)",display:"block",marginTop:"0.25rem"}}>{tool.url}</a>}
                      {tool.tags.length > 0 && <div className="tool-tags" style={{marginTop:"0.3rem"}}>{tool.tags.map(t => <span key={t}>{t}</span>)}</div>}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeDimension === "cases" && (
              <section className="section-block in-shell">
                <div className="section-title-row">
                  <FileText size={17} /><h2>真实案例</h2>
                  {isEditMode && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("cases")}>
                        <Plus size={13} /> 新增案例
                      </button>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal("cases")}>
                        <Plus size={13} /> 新增对比组件
                      </button>
                    </div>
                  )}
                </div>
                <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab="cases" isEditMode={isEditMode} onEdit={(b) => openCompareModal("cases", b)} onDelete={deleteCompareBlock} />
                <div className="cases-grid">
                  {(activeModule.cases ?? []).map((c) => (
                    <article key={c.id} id={`item-${c.id}`} className="case-card">
                      <div className="card-edit-row">
                        <h4>{c.title}</h4>
                        {isEditMode && (
                          <div className="card-edit-btns">
                            <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("cases", c)}><PenLine size={11}/></button>
                            <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除此案例？")) deleteCase(activeModule.id, c.id); }}><Trash2 size={11}/></button>
                          </div>
                        )}
                      </div>
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
                <div className="section-title-row">
                  <BrainCircuit size={17} /><h2>能力雷达</h2>
                  {isEditMode && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("skills")}>
                        <Plus size={13} /> 新增技能
                      </button>
                    </div>
                  )}
                </div>
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
                        {isEditMode && (
                          <div className="card-edit-btns">
                            <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("skills", skill)}><PenLine size={11}/></button>
                            <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除此技能？")) deleteSkill(activeModule.id, skill.id); }}><Trash2 size={11}/></button>
                          </div>
                        )}
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
                <div className="section-title-row">
                  <Rocket size={17} /><h2>成长路径</h2>
                  {isEditMode && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("path")}>
                        <Plus size={13} /> 新增路径节点
                      </button>
                    </div>
                  )}
                </div>
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
                          {isEditMode && (
                            <div className="card-edit-btns">
                              <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("path", node)}><PenLine size={11}/></button>
                              <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除此路径节点？")) deletePathNode(activeModule.id, node.id); }}><Trash2 size={11}/></button>
                            </div>
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
                <div className="section-title-row">
                  <FileText size={17} /><h2>面试准备 <span style={{fontSize:"0.75rem",color:"var(--c-neon)",marginLeft:"0.5rem"}}>{activeModule.interviewQuestions?.length ?? 0} 题</span></h2>
                  {isEditMode && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("interview")}>
                        <Plus size={13} /> 新增面试题
                      </button>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal("interview")}>
                        <Plus size={13} /> 新增对比组件
                      </button>
                    </div>
                  )}
                </div>
                <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab="interview" isEditMode={isEditMode} onEdit={(b) => openCompareModal("interview", b)} onDelete={deleteCompareBlock} />
                {(activeModule.interviewQuestions ?? []).length === 0
                  ? <p className="empty-hint">本模块暂未配置面试题</p>
                  : <InterviewPanel
                      questions={activeModule.interviewQuestions ?? []}
                      isEditMode={isEditMode}
                      onEdit={(q) => openTabItemModal("interview", q)}
                      onDelete={(id) => deleteInterview(activeModule.id, id)}
                    />
                }
              </section>
            )}

            {activeDimension === "career" && (
              <section className="section-block in-shell">
                <div className="section-title-row">
                  <Compass size={17} /><h2>15天职业规划</h2>
                  {isEditMode && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
                      <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("career")}>
                        <Plus size={13} /> 新增职业规划
                      </button>
                    </div>
                  )}
                </div>
                {(activeModule.careerPlan ?? []).length === 0 && (
                  <p className="empty-hint">本模块暂未配置职业规划</p>
                )}
                <div className="career-timeline">
                  {(activeModule.careerPlan ?? []).map((m) => (
                    <article key={m.id} id={`item-${m.id}`} className="career-card">
                      <div className="career-week">
                        <span className="career-week-label">{m.week}</span>
                        <span className="career-phase">{m.phase}</span>
                        {isEditMode && (
                          <div className="card-edit-btns">
                            <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("career", m)}><PenLine size={11}/></button>
                            <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除此职业规划条目？")) deleteCareer(activeModule.id, m.id); }}><Trash2 size={11}/></button>
                          </div>
                        )}
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

      {/* ── Node Editor Modal ── */}
      {nodeModal.open && (
        <NodeEditorModal
          node={nodeModal.node}
          moduleId={nodeModal.moduleId}
          onSave={(node) => {
            if (nodeModal.node) {
              editNode(nodeModal.moduleId, node.id, node);
            } else {
              addNode(nodeModal.moduleId, node);
            }
          }}
          onDelete={nodeModal.node ? () => deleteNode(nodeModal.moduleId, nodeModal.node!.id) : undefined}
          onClose={() => setNodeModal({ open: false, node: null, moduleId: "" })}
        />
      )}

      {/* ── Module Editor Modal ── */}
      {moduleModal.open && (
        <ModuleEditorModal
          module={moduleModal.module}
          onSave={(fields) => {
            if (moduleModal.module) {
              editModule(fields.id, { name: fields.name, icon: fields.icon, intro: fields.intro });
            } else {
              addModule({
                id: fields.id,
                name: fields.name,
                icon: fields.icon,
                intro: fields.intro,
                order: (sortedModules[sortedModules.length - 1]?.order ?? 0) + 1,
                knowledgeNodes: [],
                operationSteps: [],
                cases: [],
              });
              setActiveModuleId(fields.id);
            }
          }}
          onDelete={moduleModal.module ? () => {
            deleteModule(moduleModal.module!.id);
            const next = sortedModules.find(m => m.id !== moduleModal.module!.id);
            if (next) setActiveModuleId(next.id);
          } : undefined}
          onClose={() => setModuleModal({ open: false, module: null })}
        />
      )}

      <footer className="footer-note compact">
        <Compass size={15} />
        知识可持续沉淀：新增 PPT/PDF 经 AI 分析后按模块写入，支持去重、补充、更新三种合并策略。
      </footer>
      {syncStatus !== "idle" && (
        <div className="note-toast">
          {syncStatus === "syncing" && <span><span className="note-spin" style={{display:"inline-block"}}>⟳</span> 同步到 GitHub…</span>}
          {syncStatus === "done" && <span className="note-ok">☁ {syncMsg}</span>}
          {syncStatus === "error" && <span className="note-err">✗ {syncMsg}</span>}
        </div>
      )}

      {/* ── Edit controls (fixed top-right) ── */}
      <div className="edit-controls-stack">
        <button
          type="button"
          className={`edit-mode-lock-btn ${isEditMode ? "active" : ""}`}
          title={isEditMode ? "退出编辑模式" : "进入编辑模式"}
          onClick={requestEdit}
        >
          {isEditMode ? <LockOpen size={15} /> : <Lock size={15} />}
          {isEditMode && <span>编辑中</span>}
        </button>

        {isEditMode && (<>
          <button
            type="button"
            className="edit-mode-lock-btn"
            style={{ fontSize: "0.65rem" }}
            title="清除本地缓存，回归原始数据"
            onClick={() => {
              if (confirm("清除所有本地缓存？页面将刷新，数据回归原始 .ts 文件。")) {
                localStorage.removeItem("aishow_content_store");
                location.reload();
              }
            }}
          >
            ⟳ 清除缓存
          </button>
          <button
            type="button"
            className="edit-mode-lock-btn"
            style={{ fontSize: "0.65rem" }}
            title="扫描并删除未引用的图片"
            onClick={() => setShowImageCleanup(true)}
          >
            🗑 清理图片
          </button>
        </>)}
      </div>

      {/* ── Image Cleanup Modal ── */}
      {showImageCleanup && <ImageCleanupModal onClose={() => setShowImageCleanup(false)} />}

      {/* ── Compare Block Editor Modal ── */}
      {compareModal.open && (
        <CompareBlockEditor
          block={compareModal.block}
          moduleId={activeModule.id}
          dimensionTab={compareModal.dimensionTab}
          onSave={(block) => {
            if (compareModal.block) {
              editCompareBlock(block.id, block);
            } else {
              addCompareBlock(block);
            }
          }}
          onDelete={compareModal.block ? () => deleteCompareBlock(compareModal.block!.id) : undefined}
          onClose={() => setCompareModal({ open: false, block: null, dimensionTab: "knowledge" })}
        />
      )}

      {tabItemModal.open && (
        <TabItemEditor
          tab={tabItemModal.tab}
          item={tabItemModal.item}
          onSave={(saved) => handleTabItemSave(tabItemModal.tab, saved as AnyTabItem)}
          onDelete={tabItemModal.item ? () => handleTabItemDelete(tabItemModal.tab, tabItemModal.item!.id) : undefined}
          onClose={closeTabItemModal}
        />
      )}

      {/* ── Password prompt modal ── */}
      {showPrompt && (
        <div className="note-overlay" onClick={cancelPrompt}>
          <div className="note-modal" style={{maxWidth:320}} onClick={e => e.stopPropagation()}>
            <div className="note-modal-header">
              <span><Lock size={14}/> 请输入编辑密码</span>
              <button type="button" className="note-close" onClick={cancelPrompt}><X size={14}/></button>
            </div>
            <div className="note-edit-body">
              <div className="note-field">
                <input
                  className={`note-input ${error ? "note-input-error" : ""}`}
                  type="password"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitPassword()}
                  placeholder="请输入密码"
                  autoFocus
                />
                {error && <p style={{color:"#f06060",fontSize:"0.72rem",margin:"0.2rem 0 0"}}>密码错误，请重试</p>}
              </div>
            </div>
            <div className="note-modal-footer">
              <span />
              <button type="button" className="note-save-btn note-save-btn-active" onClick={submitPassword}>
                <LockOpen size={13}/> 进入编辑模式
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context menu portal — rendered at body level to avoid z-index/overflow clipping */}
      {ctxMenu && isEditMode && typeof document !== "undefined" && createPortal(
        <div className="module-ctx-menu" style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={e => e.stopPropagation()}>
          <button type="button" className="module-ctx-item" onClick={() => {
            const mod = sortedModules.find(m => m.id === ctxMenu.moduleId)!;
            setCtxMenu(null); setModuleModal({ open: true, module: mod });
          }}><PenLine size={12} /> 编辑模块</button>
          <button type="button" className="module-ctx-item module-ctx-delete" onClick={() => {
            const mod = sortedModules.find(m => m.id === ctxMenu.moduleId)!;
            setCtxMenu(null);
            if (confirm(`确定删除模块「${mod.name}」？`)) {
              deleteModule(mod.id);
              if (activeModuleId === mod.id) {
                const next = sortedModules.find(m => m.id !== mod.id);
                if (next) setActiveModuleId(next.id);
              }
            }
          }}><Trash2 size={12} /> 删除模块</button>
        </div>,
        document.body
      )}
    </main>
  );
}
