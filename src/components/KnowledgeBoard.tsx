"use client";
/* eslint-disable react-hooks/preserve-manual-memoization */

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Compass,
  FileText,
  Rocket,
  Save,
  Sparkles,
  Wrench,
  PenLine,
  Trash2,
  Lock,
  LockOpen,
  X,
  Plus,
  RefreshCw,
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
import type { KnowledgeNode, LearningModule, CompareBlock, OperationStep, CaseStudy, SkillItem, LearningPathNode, InterviewQuestion, CareerMilestone, ToolItem, DimensionTab, TabConfig, TabWidget } from "@/data/types";
import { ALL_TABS, ALL_WIDGETS } from "@/components/ModuleEditor";

// ── Standalone compare block list (avoids React Compiler memoization issue) ──
function TabLabelEditor({ init, isBuiltin, onSave }: {
  init: TabConfig | null;
  isBuiltin: boolean;
  onSave: (tab: TabConfig) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(init?.label ?? "");
  const defaultWidgets = isBuiltin
    ? (ALL_TABS.find(t => t.key === init?.key)?.widgets ?? ["compare"])
    : ["compare" as TabWidget];
  const [widgets, setWidgets] = useState<TabWidget[]>(init?.widgets ?? defaultWidgets);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);

  const toggleWidget = (key: TabWidget) =>
    setWidgets(prev => prev.includes(key) ? prev.filter(w => w !== key) : [...prev, key]);

  const moveWidget = (idx: number, dir: -1 | 1) => {
    setWidgets(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const save = () => {
    if (!label.trim()) return;
    const key = init?.key ?? ("custom-" + label.trim().replace(/\s+/g, "-").toLowerCase() + "-" + Math.random().toString(36).slice(2, 5));
    onSave({ key, label: label.trim(), widgets });
  };
  return (
    <>
      <div className="note-field">
        <label className="note-label">Tab 名称{isBuiltin && <span style={{color:"#5a7898",marginLeft:"0.3rem",fontWeight:400}}>（内置 Tab，仅可改名）</span>}</label>
        <input ref={ref} className="note-input" value={label} onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); save(); } }}
          placeholder="Tab 显示名称" />
      </div>
      <div className="note-field">
        <label className="note-label">可新增的组件类型</label>
        <div className="node-level-btns" style={{flexWrap:"wrap",gap:"0.35rem",marginBottom:"0.5rem"}}>
          {ALL_WIDGETS.map(w => (
            <button key={w.key} type="button"
              className={`node-level-btn ${widgets.includes(w.key) ? "active" : ""}`}
              title={w.desc}
              onClick={() => toggleWidget(w.key)}
            >{w.label}</button>
          ))}
        </div>
        {/* Ordered list of selected widgets — drag/reorder with arrows */}
        {widgets.length > 0 && (
          <>
            <label className="note-label" style={{marginTop:"0.4rem"}}>显示顺序 <span style={{color:"#5a7898",fontWeight:400}}>（拖动箭头调整）</span></label>
            <div style={{display:"flex",flexDirection:"column",gap:"0.25rem"}}>
              {widgets.map((key, idx) => {
                const meta = ALL_WIDGETS.find(w => w.key === key);
                return (
                  <div key={key} style={{display:"flex",alignItems:"center",gap:"0.35rem",background:"rgba(40,70,120,0.18)",border:"1px solid rgba(80,130,220,0.2)",borderRadius:"6px",padding:"0.22rem 0.5rem"}}>
                    <span style={{flex:1,fontSize:"0.78rem",color:"#a0c4f0"}}>
                      <span style={{color:"#5a7898",marginRight:"0.4rem",fontVariantNumeric:"tabular-nums"}}>{idx + 1}.</span>
                      {meta?.label ?? key}
                    </span>
                    <button type="button" disabled={idx === 0}
                      onClick={() => moveWidget(idx, -1)}
                      style={{appearance:"none",background:"none",border:"none",color: idx === 0 ? "#2a4060" : "#7aaad0",cursor: idx === 0 ? "default" : "pointer",padding:"0 0.15rem",lineHeight:1,fontSize:"0.85rem"}}
                      title="上移"
                    >▲</button>
                    <button type="button" disabled={idx === widgets.length - 1}
                      onClick={() => moveWidget(idx, 1)}
                      style={{appearance:"none",background:"none",border:"none",color: idx === widgets.length - 1 ? "#2a4060" : "#7aaad0",cursor: idx === widgets.length - 1 ? "default" : "pointer",padding:"0 0.15rem",lineHeight:1,fontSize:"0.85rem"}}
                      title="下移"
                    >▼</button>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <span style={{fontSize:"0.72rem",color:"#5a7898",marginTop:"0.4rem",display:"block"}}>
          勾选组件后在此调整显示顺序，内容区按此顺序渲染
        </span>
      </div>
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> 保存</button>
    </>
  );
}

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

type KnowledgeLevelFilter = "全部" | (typeof levelOrder)[number];

export function KnowledgeBoard() {
  const { mergedModules, deleteNode, addNode, editNode, addModule, deleteModule, editModule, addCompareBlock, editCompareBlock, deleteCompareBlock, addOperation, editOperation, deleteOperation, addCase, editCase, deleteCase, addSkill, editSkill, deleteSkill, addPathNode, editPathNode, deletePathNode, addInterview, editInterview, deleteInterview, addCareer, editCareer, deleteCareer, addTool, editTool, deleteTool, store, syncStatus, syncMsg, hasDraftChanges, beginDraft, commitDraft, discardDraft } = useContentStore();
  const { isEditMode, showPrompt, input, setInput, error, requestEdit, submitPassword, cancelPrompt, registerOnBeforeExit } = useEditMode();

  // Save/discard confirmation dialog state
  const [savePrompt, setSavePrompt] = useState<{ resolve: (v: boolean) => void } | null>(null);

  // Register the before-exit handler once
  useEffect(() => {
    registerOnBeforeExit(async () => {
      if (!hasDraftChanges) { discardDraft(); return true; }
      return new Promise<boolean>(resolve => setSavePrompt({ resolve }));
    });
  }, [registerOnBeforeExit, hasDraftChanges, discardDraft]);

  // Start a draft whenever edit mode is entered
  useEffect(() => {
    if (isEditMode) beginDraft();
  }, [isEditMode, beginDraft]);

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
  const [tabCtxMenu, setTabCtxMenu] = useState<{ tab: TabConfig; x: number; y: number } | null>(null);
  const [tabEditModal, setTabEditModal] = useState<{ open: boolean; tab: TabConfig | null }>({ open: false, tab: null });

  // Block page refresh/close when in edit mode with unsaved local changes
  useEffect(() => {
    const s = store;
    const hasChanges =
      Object.keys(s.nodeEdits).length > 0 ||
      Object.values(s.addedNodes).some(a => a.length > 0) ||
      s.deletedNodes.length > 0 ||
      Object.values(s.addedOperations).some(a => a.length > 0) ||
      Object.keys(s.editedOperations).length > 0 ||
      s.deletedOperations.length > 0 ||
      Object.values(s.addedCases).some(a => a.length > 0) ||
      Object.keys(s.editedCases).length > 0 ||
      s.deletedCases.length > 0 ||
      Object.values(s.addedSkills).some(a => a.length > 0) ||
      Object.keys(s.editedSkills).length > 0 ||
      s.deletedSkills.length > 0 ||
      Object.values(s.addedPathNodes).some(a => a.length > 0) ||
      Object.keys(s.editedPathNodes).length > 0 ||
      s.deletedPathNodes.length > 0 ||
      Object.values(s.addedInterviews).some(a => a.length > 0) ||
      Object.keys(s.editedInterviews).length > 0 ||
      s.deletedInterviews.length > 0 ||
      Object.values(s.addedCareer).some(a => a.length > 0) ||
      Object.keys(s.editedCareer).length > 0 ||
      s.deletedCareer.length > 0 ||
      Object.values(s.addedTools).some(a => a.length > 0) ||
      Object.keys(s.editedTools).length > 0 ||
      s.deletedTools.length > 0 ||
      s.addedModules.length > 0 ||
      s.deletedModules.length > 0 ||
      Object.keys(s.moduleEdits).length > 0 ||
      s.compareBlocks.length > 0;
    if (!isEditMode || !hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditMode, store]);

  // Close context menu on outside click — delayed to avoid same-event close
  useEffect(() => {
    if (!ctxMenu && !tabCtxMenu) return;
    const close = () => { setCtxMenu(null); setTabCtxMenu(null); };
    const timer = setTimeout(() => {
      window.addEventListener("click", close, { once: true });
      window.addEventListener("contextmenu", close, { once: true });
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [ctxMenu, tabCtxMenu]);

  type AnyTabItem = OperationStep | CaseStudy | SkillItem | LearningPathNode | InterviewQuestion | CareerMilestone | ToolItem;
  const [tabItemModal, setTabItemModal] = useState<{ open: boolean; tab: TabItemType; item: AnyTabItem | null }>({ open: false, tab: "operation", item: null });
  const openTabItemModal = (tab: TabItemType, item: AnyTabItem | null = null) => setTabItemModal({ open: true, tab, item });
  const closeTabItemModal = () => setTabItemModal(prev => ({ ...prev, open: false }));

  const handleTabItemSave = (tab: TabItemType, saved: AnyTabItem) => {
    const mid = activeModule.id;
    const isNew = !tabItemModal.item;
    const withTab = isNew ? { ...saved, dimensionTab: activeDimension } : saved;
    if (tab === "operation") { if (isNew) addOperation(mid, withTab as OperationStep); else editOperation(saved.id, saved as OperationStep); }
    else if (tab === "cases")     { if (isNew) addCase(mid, withTab as CaseStudy);          else editCase(saved.id, saved as CaseStudy); }
    else if (tab === "skills")    { if (isNew) addSkill(mid, withTab as SkillItem);         else editSkill(saved.id, saved as SkillItem); }
    else if (tab === "path")      { if (isNew) addPathNode(mid, withTab as LearningPathNode); else editPathNode(saved.id, saved as LearningPathNode); }
    else if (tab === "interview") { if (isNew) addInterview(mid, withTab as InterviewQuestion); else editInterview(saved.id, saved as InterviewQuestion); }
    else if (tab === "career")    { if (isNew) addCareer(mid, withTab as CareerMilestone);   else editCareer(saved.id, saved as CareerMilestone); }
    else if (tab === "tools")     { if (isNew) addTool(mid, withTab as ToolItem);            else editTool(saved.id, saved as ToolItem); }
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

  // If the active dimension is not enabled for this module, reset to first enabled tab
  useEffect(() => {
    if (!activeModule) return;
    const enabled = activeModule.enabledTabs;
    if (enabled && !enabled.some(t => t.key === activeDimension)) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setActiveDimension(enabled[0]?.key ?? "knowledge");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [activeModule, activeDimension]);
  const visibleKnowledge = useMemo(() => {
    // Items with dimensionTab only show on their own tab; items without show on "knowledge"
    const forThisTab = activeModule.knowledgeNodes.filter(n =>
      (n.dimensionTab ?? "knowledge") === activeDimension
    );
    if (levelFilter === "全部") return forThisTab;
    return forThisTab.filter((item) => item.level === levelFilter);
  }, [activeModule, levelFilter, activeDimension]);

  // Compute active widgets early so tocItems can use it
  const _dims = activeModule.enabledTabs ?? ALL_TABS;
  const _activeTabCfg = _dims.find(d => d.key === activeDimension);
  const activeWidgets: TabWidget[] = _activeTabCfg?.widgets
    ?? ALL_TABS.find(t => t.key === activeDimension)?.widgets
    ?? ["compare"];
  const hasWidget = (w: TabWidget) => activeWidgets.includes(w);

  const tocItems = useMemo(() => {
    if (!activeModule) return [];
    // Build toc from all active widgets in current tab
    const items: { id: string; label: string }[] = [];
    for (const w of activeWidgets) {
      if (w === "knowledge") visibleKnowledge.forEach(n => items.push({ id: n.id, label: n.title }));
      else if (w === "operation") activeModule.operationSteps.forEach(s => items.push({ id: s.id, label: s.title }));
      else if (w === "case") (activeModule.cases ?? []).forEach(c => items.push({ id: c.id, label: c.title }));
      else if (w === "tool") (activeModule.tools ?? []).forEach(t => items.push({ id: t.id, label: t.name }));
      else if (w === "skill") (activeModule.skills ?? []).forEach(s => items.push({ id: s.id, label: s.name }));
      else if (w === "path") (activeModule.learningPath ?? []).forEach(p => items.push({ id: p.id, label: p.title }));
      else if (w === "interview") (activeModule.interviewQuestions ?? []).forEach(q => items.push({ id: q.id, label: q.question.slice(0, 18) + (q.question.length > 18 ? "…" : "") }));
      else if (w === "career") (activeModule.careerPlan ?? []).forEach(c => items.push({ id: c.id, label: c.week + " " + c.phase }));
    }
    return items;
  }, [activeDimension, activeModule, activeWidgets, visibleKnowledge]);

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

  const allDimensions: TabConfig[] = ALL_TABS;
  const dimensions: TabConfig[] = activeModule.enabledTabs ?? allDimensions;

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
              · {(activeModule.tools ?? []).length} 工具
              · {activeModule.cases?.length ?? 0} 案例
            </span>
          </div>
          <div className="dimension-menu" aria-label="维度切换">
            {dimensions.map((d) => (
              <button key={d.key} type="button"
                className={`dimension-btn ${activeDimension === d.key ? "active" : ""}`}
                onClick={() => setActiveDimension(d.key)}
                onContextMenu={isEditMode ? (e) => { e.preventDefault(); setTabCtxMenu({ tab: d, x: e.clientX, y: e.clientY }); } : undefined}
              >{d.label}</button>
            ))}
            {isEditMode && (
              <button type="button" className="dimension-btn" style={{opacity:0.5,fontSize:"0.72rem"}}
                onClick={() => setTabEditModal({ open: true, tab: null })}>
                <Plus size={11}/> 新增 Tab
              </button>
            )}
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
                      {hasWidget("knowledge") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => setNodeModal({ open: true, node: null, moduleId: activeModule.id })}>
                        <Plus size={13} /> 新增知识点
                      </button>}
                      {hasWidget("compare") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal(activeDimension)}>
                        <Plus size={13} /> 新增对比组件
                      </button>}
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
                <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />

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
                      {hasWidget("operation") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("operation")}>
                        <Plus size={13} /> 新增操作步骤
                      </button>}
                      {hasWidget("compare") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal(activeDimension)}>
                        <Plus size={13} /> 新增对比组件
                      </button>}
                    </div>
                  )}
                </div>
                <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                <div className="timeline">
                  {activeModule.operationSteps.filter(s => (s.dimensionTab ?? "operation") === activeDimension).map((step, idx) => (
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
                      {hasWidget("tool") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("tools")}>
                        <Plus size={13} /> 新增工具
                      </button>}
                      {hasWidget("compare") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal(activeDimension)}>
                        <Plus size={13} /> 新增对比组件
                      </button>}
                    </div>
                  )}
                </div>
                <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                {(activeModule.tools ?? []).length === 0 && (
                  <p className="empty-hint">本模块暂未配置工具，点击「新增工具」添加</p>
                )}
                <div className="tool-heat-grid">
                  {(activeModule.tools ?? []).filter(t => (t.dimensionTab ?? "tools") === activeDimension).map((tool) => (
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
                      {hasWidget("case") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("cases")}>
                        <Plus size={13} /> 新增案例
                      </button>}
                      {hasWidget("compare") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal(activeDimension)}>
                        <Plus size={13} /> 新增对比组件
                      </button>}
                    </div>
                  )}
                </div>
                <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                <div className="cases-grid">
                  {(activeModule.cases ?? []).filter(c => (c.dimensionTab ?? "cases") === activeDimension).map((c) => (
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
                      {hasWidget("skill") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("skills")}>
                        <Plus size={13} /> 新增技能
                      </button>}
                      {hasWidget("compare") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal(activeDimension)}>
                        <Plus size={13} /> 新增对比组件
                      </button>}
                    </div>
                  )}
                </div>
                {(activeModule.skills ?? []).length === 0 && (
                  <p className="empty-hint">本模块暂未配置能力要求</p>
                )}
                <div className="skills-grid">
                  {(activeModule.skills ?? []).filter(s => (s.dimensionTab ?? "skills") === activeDimension).map((skill) => (
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
                      {hasWidget("path") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("path")}>
                        <Plus size={13} /> 新增路径节点
                      </button>}
                      {hasWidget("compare") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal(activeDimension)}>
                        <Plus size={13} /> 新增对比组件
                      </button>}
                    </div>
                  )}
                </div>
                {(activeModule.learningPath ?? []).length === 0 && (
                  <p className="empty-hint">本模块暂未配置学习路径</p>
                )}
                <div className="learning-path">
                  {(activeModule.learningPath ?? []).filter(p => (p.dimensionTab ?? "path") === activeDimension).map((node, idx) => (
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
                      {hasWidget("interview") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("interview")}>
                        <Plus size={13} /> 新增面试题
                      </button>}
                      {hasWidget("compare") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal(activeDimension)}>
                        <Plus size={13} /> 新增对比组件
                      </button>}
                    </div>
                  )}
                </div>
                <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                {(() => {
                  const filtered = (activeModule.interviewQuestions ?? []).filter(q => (q.dimensionTab ?? "interview") === activeDimension);
                  return filtered.length === 0
                    ? <p className="empty-hint">本模块暂未配置面试题</p>
                    : <InterviewPanel
                        questions={filtered}
                        isEditMode={isEditMode}
                        onEdit={(q) => openTabItemModal("interview", q)}
                        onDelete={(id) => deleteInterview(activeModule.id, id)}
                      />;
                })()}
              </section>
            )}

            {activeDimension === "career" && (
              <section className="section-block in-shell">
                <div className="section-title-row">
                  <Compass size={17} /><h2>15天职业规划</h2>
                  {isEditMode && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
                      {hasWidget("career") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openTabItemModal("career")}>
                        <Plus size={13} /> 新增职业规划
                      </button>}
                      {hasWidget("compare") && <button type="button" className="section-add-btn" style={{ marginLeft: 0 }}
                        onClick={() => openCompareModal(activeDimension)}>
                        <Plus size={13} /> 新增对比组件
                      </button>}
                    </div>
                  )}
                </div>
                {(activeModule.careerPlan ?? []).length === 0 && (
                  <p className="empty-hint">本模块暂未配置职业规划</p>
                )}
                <div className="career-timeline">
                  {(activeModule.careerPlan ?? []).filter(m => (m.dimensionTab ?? "career") === activeDimension).map((m) => (
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

            {/* ── Extra widgets: render content blocks for widgets added to a builtin tab ── */}
            {(() => {
              // Map each builtin tab to its native widget
              const nativeWidget: Record<string, TabWidget> = {
                knowledge: "knowledge", operation: "operation", skills: "skill",
                path: "path", interview: "interview", career: "career",
                tools: "tool", cases: "case",
              };
              const native = nativeWidget[activeDimension];
              // Only apply for builtin tabs that have extra widgets configured
              if (!ALL_TABS.some(t => t.key === activeDimension)) return null;
              const extras = activeWidgets.filter(w => w !== native && w !== "compare");
              if (extras.length === 0) return null;
              return extras.map(widget => (
                <section key={widget} className="section-block in-shell">
                  <div className="section-title-row">
                    <FileText size={17}/><h2>{ALL_WIDGETS.find(w => w.key === widget)?.label ?? widget}</h2>
                    {isEditMode && (
                      <div style={{marginLeft:"auto",display:"flex",gap:"0.35rem"}}>
                        {widget === "knowledge" && <button type="button" className="section-add-btn"
                          onClick={() => setNodeModal({ open: true, node: null, moduleId: activeModule.id })}><Plus size={13}/> 新增知识点</button>}
                        {widget === "operation" && <button type="button" className="section-add-btn"
                          onClick={() => openTabItemModal("operation")}><Plus size={13}/> 新增操作步骤</button>}
                        {widget === "case" && <button type="button" className="section-add-btn"
                          onClick={() => openTabItemModal("cases")}><Plus size={13}/> 新增案例</button>}
                        {widget === "skill" && <button type="button" className="section-add-btn"
                          onClick={() => openTabItemModal("skills")}><Plus size={13}/> 新增技能</button>}
                        {widget === "path" && <button type="button" className="section-add-btn"
                          onClick={() => openTabItemModal("path")}><Plus size={13}/> 新增路径节点</button>}
                        {widget === "interview" && <button type="button" className="section-add-btn"
                          onClick={() => openTabItemModal("interview")}><Plus size={13}/> 新增面试题</button>}
                        {widget === "career" && <button type="button" className="section-add-btn"
                          onClick={() => openTabItemModal("career")}><Plus size={13}/> 新增职业规划</button>}
                        {widget === "tool" && <button type="button" className="section-add-btn"
                          onClick={() => openTabItemModal("tools")}><Plus size={13}/> 新增工具</button>}
                      </div>
                    )}
                  </div>
                  {/* Render the widget's content list */}
                  {widget === "knowledge" && (
                    <div className="cards knowledge-dense-grid">
                      {activeModule.knowledgeNodes.length === 0 && <p className="empty-hint">暂无知识点</p>}
                      {activeModule.knowledgeNodes.filter(n => (n.dimensionTab ?? "knowledge") === activeDimension).map(rawNode => (
                        <KnowledgeCard key={rawNode.id} rawNode={rawNode}
                          operationSteps={activeModule.operationSteps} onJumpToOp={jumpToOp}
                          onEdit={isEditMode ? (node) => setNodeModal({ open: true, node, moduleId: activeModule.id }) : undefined}
                          onDelete={isEditMode ? (nodeId) => deleteNode(activeModule.id, nodeId) : undefined}
                        />
                      ))}
                    </div>
                  )}
                  {widget === "operation" && (
                    <div className="timeline">
                      {activeModule.operationSteps.length === 0 && <p className="empty-hint">暂无操作步骤</p>}
                      {activeModule.operationSteps.filter(s => (s.dimensionTab ?? "operation") === activeDimension).map((step, idx) => (
                        <article key={step.id} id={`item-${step.id}`} className="timeline-card">
                          <div className="timeline-idx">{String(idx+1).padStart(2,"0")}</div>
                          <div className="timeline-content">
                            <div className="card-edit-row"><strong>{step.title}</strong>
                              {isEditMode && <div className="card-edit-btns">
                                <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("operation", step)}><PenLine size={11}/></button>
                                <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除？")) deleteOperation(activeModule.id, step.id); }}><Trash2 size={11}/></button>
                              </div>}
                            </div>
                            <p className="timeline-target">{step.target}</p>
                            <p className="timeline-detail">{step.detail}</p>
                            <div className="tool-tags">{step.tools.map(t => <span key={t}>{t}</span>)}</div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  {widget === "case" && (
                    <div className="cases-grid">
                      {(activeModule.cases ?? []).length === 0 && <p className="empty-hint">暂无案例</p>}
                      {(activeModule.cases ?? []).filter(c => (c.dimensionTab ?? "cases") === activeDimension).map(c => (
                        <article key={c.id} id={`item-${c.id}`} className="case-card">
                          <div className="card-edit-row"><h4>{c.title}</h4>
                            {isEditMode && <div className="card-edit-btns">
                              <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("cases", c)}><PenLine size={11}/></button>
                              <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除？")) deleteCase(activeModule.id, c.id); }}><Trash2 size={11}/></button>
                            </div>}
                          </div>
                          <div className="case-row"><em>场景</em><span>{c.scene}</span></div>
                          <div className="case-row"><em>问题</em><span>{c.problem}</span></div>
                          <div className="case-row"><em>方案</em><span>{c.solution}</span></div>
                          <div className="case-row result"><em>结果</em><span>{c.result}</span></div>
                          <div className="tool-tags">{c.tags.map(t => <span key={t}>{t}</span>)}</div>
                        </article>
                      ))}
                    </div>
                  )}
                  {widget === "skill" && (
                    <div className="skills-grid">
                      {(activeModule.skills ?? []).length === 0 && <p className="empty-hint">暂无技能</p>}
                      {(activeModule.skills ?? []).filter(s => (s.dimensionTab ?? "skills") === activeDimension).map(skill => (
                        <article key={skill.id} id={`item-${skill.id}`} className="skill-card">
                          <div className="skill-header">
                            <span className="skill-dimension">{skill.dimension}</span><strong>{skill.name}</strong>
                            <div className="skill-level-bar">{[1,2,3,4,5].map(n => <span key={n} className={`skill-dot ${n <= skill.level ? "filled" : ""}`}/>)}</div>
                            {isEditMode && <div className="card-edit-btns">
                              <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("skills", skill)}><PenLine size={11}/></button>
                              <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除？")) deleteSkill(activeModule.id, skill.id); }}><Trash2 size={11}/></button>
                            </div>}
                          </div>
                          <p className="skill-desc">{skill.description}</p>
                        </article>
                      ))}
                    </div>
                  )}
                  {widget === "tool" && (
                    <div className="tool-heat-grid">
                      {(activeModule.tools ?? []).length === 0 && <p className="empty-hint">暂无工具</p>}
                      {(activeModule.tools ?? []).filter(t => (t.dimensionTab ?? "tools") === activeDimension).map(tool => (
                        <article key={tool.id} id={`item-${tool.id}`} className="tool-heat-card">
                          <div className="card-edit-row"><strong>{tool.name}</strong>
                            {isEditMode && <div className="card-edit-btns">
                              <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("tools", tool)}><PenLine size={11}/></button>
                              <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除？")) deleteTool(activeModule.id, tool.id); }}><Trash2 size={11}/></button>
                            </div>}
                          </div>
                          <span className="tool-category">{tool.category}{tool.isPaid ? " · 付费" : " · 免费"}</span>
                          {tool.description && <p style={{fontSize:"0.75rem",color:"#8aa0c8",margin:"0.3rem 0 0"}}>{tool.description}</p>}
                          {tool.url && <a href={tool.url} target="_blank" rel="noreferrer" style={{fontSize:"0.7rem",color:"var(--c-neon)",display:"block",marginTop:"0.25rem"}}>{tool.url}</a>}
                          {tool.tags.length > 0 && <div className="tool-tags" style={{marginTop:"0.3rem"}}>{tool.tags.map(t => <span key={t}>{t}</span>)}</div>}
                        </article>
                      ))}
                    </div>
                  )}
                  {widget === "interview" && (
                    <>
                      {(activeModule.interviewQuestions ?? []).filter(q => (q.dimensionTab ?? "interview") === activeDimension).length === 0 && <p className="empty-hint">暂无面试题</p>}
                      <InterviewPanel questions={(activeModule.interviewQuestions ?? []).filter(q => (q.dimensionTab ?? "interview") === activeDimension)} isEditMode={isEditMode}
                        onEdit={q => openTabItemModal("interview", q)} onDelete={id => deleteInterview(activeModule.id, id)}/>
                    </>
                  )}
                  {widget === "career" && (
                    <div className="career-timeline">
                      {(activeModule.careerPlan ?? []).filter(m => (m.dimensionTab ?? "career") === activeDimension).length === 0 && <p className="empty-hint">暂无职业规划</p>}
                      {(activeModule.careerPlan ?? []).filter(m => (m.dimensionTab ?? "career") === activeDimension).map(m => (
                        <article key={m.id} id={`item-${m.id}`} className="career-card">
                          <div className="career-week"><span className="career-week-label">{m.week}</span><span className="career-phase">{m.phase}</span>
                            {isEditMode && <div className="card-edit-btns">
                              <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("career", m)}><PenLine size={11}/></button>
                              <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除？")) deleteCareer(activeModule.id, m.id); }}><Trash2 size={11}/></button>
                            </div>}
                          </div>
                          <div className="career-body"><p className="career-goal">🎯 {m.goal}</p></div>
                        </article>
                      ))}
                    </div>
                  )}
                  {widget === "path" && (
                    <div className="learning-path">
                      {(activeModule.learningPath ?? []).filter(p => (p.dimensionTab ?? "path") === activeDimension).length === 0 && <p className="empty-hint">暂无路径节点</p>}
                      {(activeModule.learningPath ?? []).filter(p => (p.dimensionTab ?? "path") === activeDimension).map((node, idx) => (
                        <article key={node.id} id={`item-${node.id}`} className={`path-node path-${node.level}`}>
                          <div className="path-index">{String(idx+1).padStart(2,"0")}</div>
                          <div className="path-content">
                            <div className="path-header"><strong>{node.title}</strong><span className="path-level-badge">{node.level}</span>
                              {isEditMode && <div className="card-edit-btns">
                                <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("path", node)}><PenLine size={11}/></button>
                                <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除？")) deletePathNode(activeModule.id, node.id); }}><Trash2 size={11}/></button>
                              </div>}
                            </div>
                            {node.tip && <p className="path-tip">💡 {node.tip}</p>}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ));
            })()}

            {/* Custom tab — rendered for any non-builtin tab key */}
            {!ALL_TABS.some(t => t.key === activeDimension) && (
              <section className="section-block in-shell">
                <div className="section-title-row">
                  <FileText size={17}/><h2>{dimensions.find(d => d.key === activeDimension)?.label ?? activeDimension}</h2>
                  {isEditMode && (
                    <button type="button" className="section-add-btn" style={{marginLeft:"auto"}}
                      onClick={() => openCompareModal(activeDimension)}>
                      <Plus size={13}/> 新增对比组件
                    </button>
                  )}
                </div>
                {store.compareBlocks.filter(b => b.moduleId === activeModule.id && b.dimensionTab === activeDimension).length === 0 && (
                  <p className="empty-hint">自定义 Tab — 可通过「新增对比组件」添加内容</p>
                )}
                {store.compareBlocks
                  .filter(b => b.moduleId === activeModule.id && b.dimensionTab === activeDimension)
                  .sort((a, b) => a.order - b.order)
                  .map(block => (
                    <div key={block.id} className="compare-block-wrap">
                      {isEditMode && (
                        <div className="card-edit-btns">
                          <button type="button" className="cb-action-btn" onClick={() => openCompareModal(activeDimension, block)}><PenLine size={11}/></button>
                          <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm("删除此对比组件？")) deleteCompareBlock(block.id); }}><Trash2 size={11}/></button>
                        </div>
                      )}
                    </div>
                  ))}
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
              addNode(nodeModal.moduleId, { ...node, dimensionTab: activeDimension });
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
              editModule(fields.id, { name: fields.name, icon: fields.icon, intro: fields.intro, enabledTabs: fields.enabledTabs });
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

      {/* ── Edit controls (fixed top-right) ── */}
      <div className="edit-controls-stack">
        <button
          type="button"
          className={`edit-mode-lock-btn ${isEditMode ? "active" : ""}`}
          title={isEditMode ? "退出编辑模式" : "进入编辑模式"}
          onClick={requestEdit}
        >
          {isEditMode ? <LockOpen size={15} /> : <Lock size={15} />}
        </button>

        {isEditMode && (
          <button
            type="button"
            className="edit-mode-lock-btn"
            title="扫描并删除未引用的图片"
            onClick={() => setShowImageCleanup(true)}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* ── Image Cleanup Modal ── */}
      {showImageCleanup && <ImageCleanupModal onClose={() => setShowImageCleanup(false)} />}

      {/* ── Module Editor Modal ── */}
      {moduleModal.open && (
        <ModuleEditorModal
          module={moduleModal.module}
          onSave={(fields) => {
            if (!moduleModal.module) {
              addModule({
                ...fields,
                order: (sortedModules[sortedModules.length - 1]?.order ?? 0) + 1,
                knowledgeNodes: [], operationSteps: [], cases: [],
              });
            } else {
              editModule(fields.id, { name: fields.name, icon: fields.icon, intro: fields.intro, enabledTabs: fields.enabledTabs });
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

      {/* Save/discard confirmation when exiting edit mode */}
      {savePrompt && (
        <div className="note-overlay" onClick={() => { savePrompt.resolve(false); setSavePrompt(null); }}>
          <div className="note-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="note-modal-header">
              <span>退出编辑模式</span>
              <button type="button" className="note-close" onClick={() => { savePrompt.resolve(false); setSavePrompt(null); }}><X size={14}/></button>
            </div>
            <div style={{ padding: "1.2rem 1rem", color: "#a0b8d8", fontSize: "0.85rem", lineHeight: 1.6 }}>
              你有未保存的修改。是否保存后退出？
            </div>
            <div className="note-modal-footer" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", padding: "0 1rem 1rem" }}>
              <button type="button" className="note-save-btn" style={{ background: "rgba(180,40,40,0.15)", borderColor: "rgba(220,80,80,0.3)", color: "#f08080" }}
                onClick={() => { discardDraft(); savePrompt.resolve(true); setSavePrompt(null); }}>
                放弃修改
              </button>
              <button type="button" className="note-save-btn note-save-btn-active"
                onClick={() => { commitDraft(mergedModules); savePrompt.resolve(true); setSavePrompt(null); }}>
                保存并退出
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub sync status toast */}
      {syncStatus !== "idle" && typeof document !== "undefined" && createPortal(
        <div className="note-toast">
          {syncStatus === "syncing" && <span><span className="note-spin" style={{display:"inline-block"}}>⟳</span> {syncMsg}</span>}
          {syncStatus === "done"    && <span className="note-ok">☁ {syncMsg}</span>}
          {syncStatus === "error"   && <span className="note-err">✗ {syncMsg}</span>}
        </div>,
        document.body
      )}

      {/* Tab right-click context menu */}
      {tabCtxMenu && isEditMode && typeof document !== "undefined" && createPortal(
        <div className="module-ctx-menu" style={{ top: tabCtxMenu.y, left: tabCtxMenu.x }}
          onClick={e => e.stopPropagation()}>
          <button type="button" className="module-ctx-item" onClick={() => {
            setTabCtxMenu(null); setTabEditModal({ open: true, tab: tabCtxMenu.tab });
          }}><PenLine size={12}/> 编辑 Tab</button>
          <button type="button" className="module-ctx-item module-ctx-delete" onClick={() => {
            setTabCtxMenu(null);
            if (!confirm(`确定删除 Tab「${tabCtxMenu.tab.label}」？`)) return;
            const next = (activeModule.enabledTabs ?? ALL_TABS).filter(t => t.key !== tabCtxMenu.tab.key);
            editModule(activeModule.id, { enabledTabs: next });
            if (activeDimension === tabCtxMenu.tab.key) setActiveDimension(next[0]?.key ?? "knowledge");
          }}><Trash2 size={12}/> 删除 Tab</button>
        </div>,
        document.body
      )}

      {/* Tab edit/add modal */}
      {tabEditModal.open && (
        <div className="note-overlay" onClick={() => setTabEditModal({ open: false, tab: null })}>
          <div className="note-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="note-modal-header">
              <span>{tabEditModal.tab ? "编辑 Tab" : "新增 Tab"}</span>
              <button type="button" className="note-close" onClick={() => setTabEditModal({ open: false, tab: null })}><X size={14}/></button>
            </div>
            <div className="note-edit-body">
              <TabLabelEditor
                init={tabEditModal.tab}
                isBuiltin={tabEditModal.tab ? ALL_TABS.some(t => t.key === tabEditModal.tab!.key) : false}
                onSave={(tab) => {
                  const current = activeModule.enabledTabs ?? ALL_TABS;
                  const next = tabEditModal.tab
                    ? current.map(t => t.key === tabEditModal.tab!.key ? tab : t)
                    : [...current, tab];
                  editModule(activeModule.id, { enabledTabs: next });
                  setTabEditModal({ open: false, tab: null });
                }}
                onClose={() => setTabEditModal({ open: false, tab: null })}
              />
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

      {/* ── 清除缓存 悬浮按钮（右下角）── */}
      <button
        type="button"
        title="清除本地缓存，回归原始数据"
        onClick={() => {
          if (confirm("清除所有本地缓存？页面将刷新，数据回归原始 .ts 文件。")) {
            localStorage.removeItem("aishow_content_store");
            location.reload();
          }
        }}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2.2rem",
          height: "2.2rem",
          padding: 0,
          background: "rgba(10,20,40,0.82)",
          border: "1px solid rgba(80,130,220,0.25)",
          borderRadius: "50%",
          color: "#7aaad0",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "border-color 0.18s, color 0.18s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(120,180,255,0.55)"; (e.currentTarget as HTMLButtonElement).style.color = "#a8d0f8"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(80,130,220,0.25)"; (e.currentTarget as HTMLButtonElement).style.color = "#7aaad0"; }}
      >
        <RefreshCw size={14} />
      </button>
    </main>
  );
}
