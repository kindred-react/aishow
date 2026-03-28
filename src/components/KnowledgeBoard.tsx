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
  Search,
  Sun,
  Moon,
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
import { useI18n } from "@/lib/i18n";
import type { KnowledgeNode, LearningModule, CompareBlock, OperationStep, CaseStudy, SkillItem, LearningPathNode, InterviewQuestion, CareerMilestone, ToolItem, DimensionTab, TabConfig, TabWidget } from "@/data/types";
import { ALL_TABS, ALL_WIDGETS } from "@/components/ModuleEditor";

// ── Standalone compare block list (avoids React Compiler memoization issue) ──
function TabLabelEditor({ init, isBuiltin, onSave, moduleData }: {
  init: TabConfig | null;
  isBuiltin: boolean;
  onSave: (tab: TabConfig) => void;
  onClose: () => void;
  moduleData?: import("@/data/types").LearningModule;
}) {
  const { t } = useI18n();
  // Count items for a given widget type in the merged module
  const countForWidget = (key: string): number => {
    if (!moduleData) return 0;
    const tab = init?.key ?? "";
    const check = (dim: string | undefined, native: string) => (dim ?? native) === tab;
    if (key === "knowledge") return moduleData.knowledgeNodes.filter(i => check(i.dimensionTab, "knowledge")).length;
    if (key === "operation") return moduleData.operationSteps.filter(i => check(i.dimensionTab, "operation")).length;
    if (key === "case")      return (moduleData.cases ?? []).filter(i => check(i.dimensionTab, "cases")).length;
    if (key === "tool")      return (moduleData.tools ?? []).filter(i => check(i.dimensionTab, "tools")).length;
    if (key === "skill")     return (moduleData.skills ?? []).filter(i => check(i.dimensionTab, "skills")).length;
    if (key === "path")      return (moduleData.learningPath ?? []).filter(i => check(i.dimensionTab, "path")).length;
    if (key === "interview") return (moduleData.interviewQuestions ?? []).filter(i => check(i.dimensionTab, "interview")).length;
    if (key === "career")    return (moduleData.careerPlan ?? []).filter(i => check(i.dimensionTab, "career")).length;
    return 0;
  };
  const [label, setLabel] = useState(init?.label ?? "");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);

  // Build unified widget rows: all ALL_WIDGETS in user order
  const initWidgetRows = () => {
    const saved = init?.widgets;
    if (!saved || saved.length === 0) {
      const defaults = isBuiltin
        ? (ALL_TABS.find(t => t.key === init?.key)?.widgets ?? ["compare"])
        : ["compare" as TabWidget];
      // enabled = in defaults, rest disabled
      return ALL_WIDGETS.map(w => ({ key: w.key, enabled: defaults.includes(w.key) }));
    }
    // Start with saved order (enabled)
    const rows = saved.map(k => ({ key: k, enabled: true }));
    // Append any widgets not in saved (disabled)
    ALL_WIDGETS.forEach(w => {
      if (!rows.some(r => r.key === w.key)) rows.push({ key: w.key, enabled: false });
    });
    return rows;
  };
  const [widgetRows, setWidgetRows] = useState<{ key: TabWidget; enabled: boolean }[]>(initWidgetRows);

  const toggleWidget = (key: TabWidget) =>
    setWidgetRows(prev => prev.map(r => r.key === key ? { ...r, enabled: !r.enabled } : r));

  const moveWidget = (idx: number, dir: -1 | 1) => {
    setWidgetRows(prev => {
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
    const widgets = widgetRows.filter(r => r.enabled).map(r => r.key);
    onSave({ key, label: label.trim(), widgets });
  };

  return (
    <>
      <div className="note-field">
        <label className="note-label">{t.tabName}{isBuiltin && <span style={{color:"#5a7898",marginLeft:"0.3rem",fontWeight:400}}>{t.tabNameBuiltinHint}</span>}</label>
        <input ref={ref} className="note-input" value={label} onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); save(); } }}
          placeholder={t.tabName} />
      </div>
      <div className="note-field">
        <label className="note-label">{t.tabWidgetLabel} <span style={{color:"#5a7898",fontWeight:400}}>{t.tabWidgetHint}</span></label>
        <div style={{display:"flex",flexDirection:"column",gap:"0.25rem"}}>
          {widgetRows.map((row, idx) => {
            const meta = ALL_WIDGETS.find(w => w.key === row.key);
            return (
              <div key={row.key} style={{
                display:"flex",alignItems:"center",gap:"0.4rem",
                background: row.enabled ? "rgba(40,70,120,0.22)" : "rgba(20,35,60,0.12)",
                border: `1px solid ${row.enabled ? "rgba(80,130,220,0.28)" : "rgba(60,90,140,0.15)"}`,
                borderRadius:"7px",padding:"0.28rem 0.55rem",
                opacity: row.enabled ? 1 : 0.5,
                transition:"opacity 0.15s,background 0.15s"
              }}>
                <input type="checkbox" checked={row.enabled}
                  onChange={() => toggleWidget(row.key)}
                  style={{accentColor:"var(--c-neon)",cursor:"pointer",width:"13px",height:"13px",flexShrink:0}}
                />
                <span style={{flex:1,fontSize:"0.78rem",color: row.enabled ? "#a0c4f0" : "#5a7898"}} title={meta?.desc}>
                  <span style={{color:"#4a6888",marginRight:"0.4rem",fontVariantNumeric:"tabular-nums",fontSize:"0.7rem"}}>{String(idx+1).padStart(2,"0")}</span>
                  {({
                    knowledge: t.widgetKnowledge, operation: t.widgetOperation,
                    case: t.widgetCase, skill: t.widgetSkill, path: t.widgetPath,
                    interview: t.widgetInterview, career: t.widgetCareer,
                    tool: t.widgetTool, compare: t.widgetCompare,
                  } as Record<string,string>)[row.key] ?? meta?.label ?? row.key}
                  {(() => { const c = countForWidget(row.key); return c > 0 ? <span style={{fontSize:"0.65rem",color:"#4a8898",marginLeft:"0.35rem",fontVariantNumeric:"tabular-nums"}}>{t.items(c)}</span> : null; })()}
                </span>
                <button type="button" disabled={idx === 0}
                  onClick={() => moveWidget(idx, -1)}
                  style={{appearance:"none",background:"none",border:"none",color:idx===0?"#2a4060":"#7aaad0",cursor:idx===0?"default":"pointer",padding:"0 0.1rem",lineHeight:1,fontSize:"0.8rem"}}
                  title="上移"
                >▲</button>
                <button type="button" disabled={idx === widgetRows.length - 1}
                  onClick={() => moveWidget(idx, 1)}
                  style={{appearance:"none",background:"none",border:"none",color:idx===widgetRows.length-1?"#2a4060":"#7aaad0",cursor:idx===widgetRows.length-1?"default":"pointer",padding:"0 0.1rem",lineHeight:1,fontSize:"0.8rem"}}
                  title="下移"
                >▼</button>
              </div>
            );
          })}
        </div>
        <span style={{fontSize:"0.72rem",color:"#5a7898",marginTop:"0.4rem",display:"block"}}>
          勾选的组件会在内容区显示对应「新增」按钮，顺序即为内容区渲染顺序
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
  const { t, locale, setLocale } = useI18n();

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
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("kb-theme") !== "light";
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeSearch = () => { setSearchOpen(false); setSearchQuery(""); };

  // Theme toggle with persistence
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("kb-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 60);
  }, [searchOpen]);

  // Build search index from all merged modules
  interface SearchResult { moduleId: string; moduleName: string; tabKey: string; tabLabel: string; title: string; subtitle?: string; type: string; }
  const [searchCursor, setSearchCursor] = useState(-1);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    for (const m of mergedModules) {
      const dims = m.enabledTabs ?? ALL_TABS;
      const getTab = (key: string) => dims.find(t => t.key === key)?.label ?? key;
      m.knowledgeNodes.forEach(n => {
        if (n.title.toLowerCase().includes(q) || n.summary?.toLowerCase().includes(q) || n.points?.some((p: string) => p.toLowerCase().includes(q)))
          results.push({ moduleId: m.id, moduleName: m.name, tabKey: n.dimensionTab ?? "knowledge", tabLabel: getTab(n.dimensionTab ?? "knowledge"), title: n.title, subtitle: n.summary?.slice(0,80), type: "知识" });
      });
      m.operationSteps.forEach(s => {
        if (s.title.toLowerCase().includes(q) || s.detail?.toLowerCase().includes(q) || s.target?.toLowerCase().includes(q) || s.tools?.some((tool: string) => tool.toLowerCase().includes(q)))
          results.push({ moduleId: m.id, moduleName: m.name, tabKey: s.dimensionTab ?? "operation", tabLabel: getTab(s.dimensionTab ?? "operation"), title: s.title, subtitle: s.target, type: "操作" });
      });
      (m.cases ?? []).forEach(c => {
        if (c.title.toLowerCase().includes(q) || c.scene?.toLowerCase().includes(q) || c.problem?.toLowerCase().includes(q) || c.solution?.toLowerCase().includes(q))
          results.push({ moduleId: m.id, moduleName: m.name, tabKey: c.dimensionTab ?? "cases", tabLabel: getTab(c.dimensionTab ?? "cases"), title: c.title, subtitle: c.scene, type: "案例" });
      });
      (m.tools ?? []).forEach(t => {
        if (t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.tags?.some((tag: string) => tag.toLowerCase().includes(q)) || t.category?.toLowerCase().includes(q))
          results.push({ moduleId: m.id, moduleName: m.name, tabKey: t.dimensionTab ?? "tools", tabLabel: getTab(t.dimensionTab ?? "tools"), title: t.name, subtitle: t.description, type: "工具" });
      });
      (m.skills ?? []).forEach(s => {
        if (s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.dimension?.toLowerCase().includes(q) || s.howTo?.some((h: string) => h.toLowerCase().includes(q)))
          results.push({ moduleId: m.id, moduleName: m.name, tabKey: s.dimensionTab ?? "skills", tabLabel: getTab(s.dimensionTab ?? "skills"), title: s.name, subtitle: s.description, type: "能力" });
      });
      (m.interviewQuestions ?? []).forEach(q2 => {
        if (q2.question.toLowerCase().includes(q) || q2.sampleAnswer?.toLowerCase().includes(q) || q2.keyPoints?.some((kp: string) => kp.toLowerCase().includes(q)) || q2.framework?.toLowerCase().includes(q))
          results.push({ moduleId: m.id, moduleName: m.name, tabKey: q2.dimensionTab ?? "interview", tabLabel: getTab(q2.dimensionTab ?? "interview"), title: q2.question.slice(0,80), subtitle: q2.category, type: "面试" });
      });
      (m.learningPath ?? []).forEach(p => {
        if (p.title.toLowerCase().includes(q) || p.tip?.toLowerCase().includes(q))
          results.push({ moduleId: m.id, moduleName: m.name, tabKey: p.dimensionTab ?? "path", tabLabel: getTab(p.dimensionTab ?? "path"), title: p.title, subtitle: p.tip, type: "路径" });
      });
      (m.careerPlan ?? []).forEach(c => {
        if (c.phase.toLowerCase().includes(q) || c.goal?.toLowerCase().includes(q) || c.actions?.some((a: string) => a.toLowerCase().includes(q)))
          results.push({ moduleId: m.id, moduleName: m.name, tabKey: c.dimensionTab ?? "career", tabLabel: getTab(c.dimensionTab ?? "career"), title: c.phase, subtitle: c.goal, type: "职规" });
      });
    }
    return results.slice(0, 60);
  }, [searchQuery, mergedModules]);

  // Auto-scroll active search result into view
  useEffect(() => {
    if (searchCursor < 0 || !searchResultsRef.current) return;
    const active = searchResultsRef.current.children[searchCursor] as HTMLElement | undefined;
    active?.scrollIntoView({ block: "nearest" });
  }, [searchCursor]);

  // Search keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSearchCursor(c => Math.min(c + 1, searchResults.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSearchCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === "Enter" && searchResults[searchCursor]) { jumpToResult(searchResults[searchCursor]); }
  };

  const jumpToResult = (r: SearchResult) => {
    setActiveModuleId(r.moduleId);
    setActiveDimension(r.tabKey as DimensionTab);
    closeSearch();
  };

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

  // Global keyboard shortcuts: Cmd/Ctrl+K = search, Escape = close all modals
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
      if (e.key === "Escape") {
        if (searchOpen) { closeSearch(); return; }
        if (nodeModal.open)   { setNodeModal(m => ({ ...m, open: false })); return; }
        if (compareModal.open){ setCompareModal(m => ({ ...m, open: false })); return; }
        if (tabItemModal.open){ setTabItemModal(m => ({ ...m, open: false })); return; }
        if (tabEditModal.open){ setTabEditModal(m => ({ ...m, open: false })); return; }
        if (moduleModal.open) { setModuleModal(m => ({ ...m, open: false })); return; }
        if (showImageCleanup) { setShowImageCleanup(false); return; }
        if (ctxMenu)          { setCtxMenu(null); return; }
        if (tabCtxMenu)       { setTabCtxMenu(null); return; }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, nodeModal.open, compareModal.open, tabItemModal.open, tabEditModal.open, moduleModal.open, showImageCleanup, ctxMenu, tabCtxMenu]);

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
  const activeWidgets = useMemo<TabWidget[]>(() => {
    const _dims = activeModule.enabledTabs ?? ALL_TABS;
    const _activeTabCfg = _dims.find(d => d.key === activeDimension);
    return _activeTabCfg?.widgets
      ?? ALL_TABS.find(t => t.key === activeDimension)?.widgets
      ?? ["compare"];
  }, [activeModule, activeDimension]);
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
  }, [activeModule, activeWidgets, visibleKnowledge]);

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
      </header>

      <section className="content-shell">
        <nav className="module-menu" aria-label={t.moduleMenu}>
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
          </div>
          <div className="dimension-menu" aria-label={t.dimensionNav}>
            {dimensions.map((d) => {
              // Count items belonging to this tab
              const tabCount = (() => {
                const k = d.key;
                let n = 0;
                n += activeModule.knowledgeNodes.filter(i => (i.dimensionTab ?? "knowledge") === k).length;
                n += activeModule.operationSteps.filter(i => (i.dimensionTab ?? "operation") === k).length;
                n += (activeModule.cases ?? []).filter(i => (i.dimensionTab ?? "cases") === k).length;
                n += (activeModule.tools ?? []).filter(i => (i.dimensionTab ?? "tools") === k).length;
                n += (activeModule.skills ?? []).filter(i => (i.dimensionTab ?? "skills") === k).length;
                n += (activeModule.learningPath ?? []).filter(i => (i.dimensionTab ?? "path") === k).length;
                n += (activeModule.interviewQuestions ?? []).filter(i => (i.dimensionTab ?? "interview") === k).length;
                n += (activeModule.careerPlan ?? []).filter(i => (i.dimensionTab ?? "career") === k).length;
                n += store.compareBlocks.filter(b => b.moduleId === activeModule.id && b.dimensionTab === k).length;
                return n;
              })();
              return (
                <button key={d.key} type="button"
                  className={`dimension-btn ${activeDimension === d.key ? "active" : ""}`}
                  onClick={() => setActiveDimension(d.key)}
                  onContextMenu={isEditMode ? (e) => { e.preventDefault(); setTabCtxMenu({ tab: d, x: e.clientX, y: e.clientY }); } : undefined}
                >
                  {d.label}
                  {tabCount > 0 && <span style={{fontSize:"0.65rem",opacity:0.65,marginLeft:"0.3rem",fontVariantNumeric:"tabular-nums"}}>{tabCount}</span>}
                </button>
              );
            })}
            {isEditMode && (
              <button type="button" className="dimension-btn" title={t.addTab}
                style={{opacity:0.5,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 0.6rem"}}
                onClick={() => setTabEditModal({ open: true, tab: null })}>
                <Plus size={13}/>
              </button>
            )}
          </div>
        </div>

        <div className="content-body">
          <div className="content-scroll" ref={scrollRef}>

            {/* ── Unified widget-driven rendering — fully data-driven ── */}
            {activeWidgets.map((widget) => {
              if (widget === "compare") return null;
              const addBtns: React.ReactNode[] = [];
              if (isEditMode) {
                if (widget === "knowledge") addBtns.push(<button key="ak" type="button" className="section-add-btn" onClick={() => setNodeModal({ open: true, node: null, moduleId: activeModule.id })}><Plus size={13}/> {t.addKnowledgeNode}</button>);
                if (widget === "operation") addBtns.push(<button key="aop" type="button" className="section-add-btn" onClick={() => openTabItemModal("operation")}><Plus size={13}/> 新增操作步骤</button>);
                if (widget === "case")      addBtns.push(<button key="ac" type="button" className="section-add-btn" onClick={() => openTabItemModal("cases")}><Plus size={13}/> {t.addCase}</button>);
                if (widget === "skill")     addBtns.push(<button key="ask" type="button" className="section-add-btn" onClick={() => openTabItemModal("skills")}><Plus size={13}/> {t.addSkill}</button>);
                if (widget === "path")      addBtns.push(<button key="ap" type="button" className="section-add-btn" onClick={() => openTabItemModal("path")}><Plus size={13}/> {t.addPathNode}</button>);
                if (widget === "interview") addBtns.push(<button key="aiq" type="button" className="section-add-btn" onClick={() => openTabItemModal("interview")}><Plus size={13}/> {t.addInterview}</button>);
                if (widget === "career")    addBtns.push(<button key="aca" type="button" className="section-add-btn" onClick={() => openTabItemModal("career")}><Plus size={13}/> {t.addCareer}</button>);
                if (widget === "tool")      addBtns.push(<button key="at" type="button" className="section-add-btn" onClick={() => openTabItemModal("tools")}><Plus size={13}/> {t.addTool}</button>);
                addBtns.push(<button key="acmp" type="button" className="section-add-btn" onClick={() => openCompareModal(activeDimension)}><Plus size={13}/> 新增对比组件</button>);
              }
              const renderContent = () => {
                switch (widget) {
                  case "knowledge": return (
                    <>
                      <div className="sub-filter">
                        {(["全部", ...levelOrder] as const).map((item) => (
                          <button key={item} type="button"
                            className={`sub-filter-btn ${levelFilter === item ? "active" : ""}`}
                            onClick={() => setLevelFilter(item)}
                          >{item === "全部" ? t.filterAll : item}</button>
                        ))}
                      </div>
                      {activeModule.id === "agent" && (
                        <div style={{ marginBottom: "1.2rem" }}>
                          <p style={{ fontSize: "0.8rem", color: "var(--c-violet)", marginBottom: "0.5rem", fontWeight: 600 }}>{t.agentPatternLabel}</p>
                          <AgentPatternCompare />
                          <p style={{ fontSize: "0.8rem", color: "var(--c-neon)", marginBottom: "0.5rem", marginTop: "1rem", fontWeight: 600 }}>{t.agentFrameworkLabel}</p>
                          <AgentFrameworkCompare />
                        </div>
                      )}
                      {activeModule.id === "foundations" && (
                        <div style={{ marginBottom: "1.2rem" }}>
                          <p style={{ fontSize: "0.8rem", color: "var(--c-cyan)", marginBottom: "0.5rem", fontWeight: 600 }}>{t.mlAlgorithmLabel}</p>
                          <MLAlgorithmCompare />
                        </div>
                      )}
                      <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                      <div className="cards knowledge-dense-grid">
                        {visibleKnowledge.length === 0 && <p className="empty-hint">{t.emptyKnowledge}</p>}
                        {visibleKnowledge.map((rawNode) => (
                          <KnowledgeCard key={rawNode.id} rawNode={rawNode}
                            operationSteps={activeModule.operationSteps} onJumpToOp={jumpToOp}
                            onEdit={isEditMode ? (node) => setNodeModal({ open: true, node, moduleId: activeModule.id }) : undefined}
                            onDelete={isEditMode ? (nodeId) => deleteNode(activeModule.id, nodeId) : undefined}
                          />
                        ))}
                      </div>
                    </>
                  );
                  case "operation": return (
                    <>
                      <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                      <div className="timeline">
                        {activeModule.operationSteps.filter(s => (s.dimensionTab ?? "operation") === activeDimension).length === 0 && <p className="empty-hint">{t.emptyOperation}</p>}
                        {activeModule.operationSteps.filter(s => (s.dimensionTab ?? "operation") === activeDimension).map((step, idx) => (
                          <article key={step.id} id={`item-${step.id}`}
                            ref={(el) => { opRefs.current[step.id] = el; }}
                            className={`timeline-item ${highlightOpId === step.id ? "highlighted" : ""}`}>
                            <div className="timeline-index">0{idx + 1}</div>
                            <div className="timeline-content">
                              <div className="card-edit-row"><h4>{step.title}</h4>
                                {isEditMode && <div className="card-edit-btns">
                                  <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("operation", step)}><PenLine size={11}/></button>
                                  <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm(t.deleteCompareConfirm)) deleteOperation(activeModule.id, step.id); }}><Trash2 size={11}/></button>
                                </div>}
                              </div>
                              <p className="target">目标：{step.target}</p>
                              <p>{step.detail}</p>
                              <div className="tool-tags">{step.tools.map((tool) => <span key={tool}>{tool}</span>)}</div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </>
                  );
                  case "case": return (
                    <>
                      <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                      <div className="cases-grid">
                        {(activeModule.cases ?? []).filter(c => (c.dimensionTab ?? "cases") === activeDimension).length === 0 && <p className="empty-hint">{t.emptyCase}</p>}
                        {(activeModule.cases ?? []).filter(c => (c.dimensionTab ?? "cases") === activeDimension).map((c) => (
                          <article key={c.id} id={`item-${c.id}`} className="case-card">
                            <div className="card-edit-row"><h4>{c.title}</h4>
                              {isEditMode && <div className="card-edit-btns">
                                <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("cases", c)}><PenLine size={11}/></button>
                                <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm(t.deleteCompareConfirm)) deleteCase(activeModule.id, c.id); }}><Trash2 size={11}/></button>
                              </div>}
                            </div>
                            <div className="case-row"><em>场景</em><span>{c.scene}</span></div>
                            <div className="case-row"><em>{t.problemLabel}</em><span>{c.problem}</span></div>
                            <div className="case-row"><em>方案</em><span>{c.solution}</span></div>
                            <div className="case-row result"><em>结果</em><span>{c.result}</span></div>
                            <div className="tool-tags">{c.tags.map((tg) => <span key={tg}>{tg}</span>)}</div>
                          </article>
                        ))}
                      </div>
                    </>
                  );
                  case "skill": return (
                    <>
                      <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                      <div className="skills-grid">
                        {(activeModule.skills ?? []).filter(s => (s.dimensionTab ?? "skills") === activeDimension).length === 0 && <p className="empty-hint">{t.emptySkillsModule}</p>}
                        {(activeModule.skills ?? []).filter(s => (s.dimensionTab ?? "skills") === activeDimension).map((skill) => (
                          <article key={skill.id} id={`item-${skill.id}`} className="skill-card">
                            <div className="skill-header">
                              <span className="skill-dimension">{skill.dimension}</span>
                              <strong>{skill.name}</strong>
                              <div className="skill-level-bar">{[1,2,3,4,5].map((n) => <span key={n} className={`skill-dot ${n <= skill.level ? "filled" : ""}`}/>)}</div>
                              {isEditMode && <div className="card-edit-btns">
                                <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("skills", skill)}><PenLine size={11}/></button>
                                <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm(t.deleteCompareConfirm)) deleteSkill(activeModule.id, skill.id); }}><Trash2 size={11}/></button>
                              </div>}
                            </div>
                            <p className="skill-desc">{skill.description}</p>
                            <div className="skill-howto"><span className="skill-howto-label">如何提升</span><ul>{skill.howTo.map((h) => <li key={h}>{h}</li>)}</ul></div>
                          </article>
                        ))}
                      </div>
                    </>
                  );
                  case "path": return (
                    <>
                      <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                      <div className="learning-path">
                        {(activeModule.learningPath ?? []).filter(p => (p.dimensionTab ?? "path") === activeDimension).length === 0 && <p className="empty-hint">{t.emptyPathModule}</p>}
                        {(activeModule.learningPath ?? []).filter(p => (p.dimensionTab ?? "path") === activeDimension).map((node, idx) => (
                          <article key={node.id} id={`item-${node.id}`} className={`path-node path-${node.level}`}>
                            <div className="path-index">{String(idx + 1).padStart(2, "0")}</div>
                            <div className="path-content">
                              <div className="path-header">
                                <strong>{node.title}</strong>
                                <span className="path-level-badge">{node.level}</span>
                                {node.estimatedHours && <span className="path-hours">≈ {node.estimatedHours}h</span>}
                                {isEditMode && <div className="card-edit-btns">
                                  <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("path", node)}><PenLine size={11}/></button>
                                  <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm(t.deleteCompareConfirm)) deletePathNode(activeModule.id, node.id); }}><Trash2 size={11}/></button>
                                </div>}
                              </div>
                              {node.prerequisite && node.prerequisite.length > 0 && (
                                <span className="path-prereq">前置：{node.prerequisite.map(pid => activeModule.learningPath?.find(p => p.id === pid)?.title ?? pid).join(" / ")}</span>
                              )}
                              {node.tip && <p className="path-tip">💡 {node.tip}</p>}
                            </div>
                          </article>
                        ))}
                      </div>
                    </>
                  );
                  case "interview": return (
                    <>
                      <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                      {(activeModule.interviewQuestions ?? []).filter(q => (q.dimensionTab ?? "interview") === activeDimension).length === 0
                        ? <p className="empty-hint">{t.emptyInterviewModule}</p>
                        : <InterviewPanel
                            questions={(activeModule.interviewQuestions ?? []).filter(q => (q.dimensionTab ?? "interview") === activeDimension)}
                            isEditMode={isEditMode}
                            onEdit={(q) => openTabItemModal("interview", q)}
                            onDelete={(id) => deleteInterview(activeModule.id, id)}
                          />}
                    </>
                  );
                  case "career": return (
                    <>
                      <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                      <div className="career-timeline">
                        {(activeModule.careerPlan ?? []).filter(m => (m.dimensionTab ?? "career") === activeDimension).length === 0 && <p className="empty-hint">{t.emptyCareerModule}</p>}
                        {(activeModule.careerPlan ?? []).filter(m => (m.dimensionTab ?? "career") === activeDimension).map((m) => (
                          <article key={m.id} id={`item-${m.id}`} className="career-card">
                            <div className="career-week">
                              <span className="career-week-label">{m.week}</span>
                              <span className="career-phase">{m.phase}</span>
                              {isEditMode && <div className="card-edit-btns">
                                <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("career", m)}><PenLine size={11}/></button>
                                <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm(t.deleteCompareConfirm)) deleteCareer(activeModule.id, m.id); }}><Trash2 size={11}/></button>
                              </div>}
                            </div>
                            <div className="career-body">
                              <p className="career-goal">🎯 {m.goal}</p>
                              <ul className="career-actions">{m.actions.map((a) => <li key={a}>{a}</li>)}</ul>
                              <div className="career-footer">
                                <span className="career-deliverable">📦 交付物：{m.deliverable}</span>
                                <span className="career-check">✅ 验收：{m.checkPoint}</span>
                              </div>
                              {m.resources && m.resources.length > 0 && <div className="career-resources">{m.resources.map((r) => <span key={r}>{r}</span>)}</div>}
                            </div>
                          </article>
                        ))}
                      </div>
                    </>
                  );
                  case "tool": return (
                    <>
                      <CompareBlockList blocks={store.compareBlocks} moduleId={activeModule.id} dimensionTab={activeDimension} isEditMode={isEditMode} onEdit={(b) => openCompareModal(activeDimension, b)} onDelete={deleteCompareBlock} />
                      <div className="tool-heat-grid">
                        {(activeModule.tools ?? []).filter(tool => (tool.dimensionTab ?? "tools") === activeDimension).length === 0 && <p className="empty-hint">{t.emptyToolsModule}</p>}
                        {(activeModule.tools ?? []).filter(tool => (tool.dimensionTab ?? "tools") === activeDimension).map((tool) => (
                          <article key={tool.id} id={`item-${tool.id}`} className="tool-heat-card">
                            <div className="card-edit-row"><strong>{tool.name}</strong>
                              {isEditMode && <div className="card-edit-btns">
                                <button type="button" className="cb-action-btn" onClick={() => openTabItemModal("tools", tool)}><PenLine size={11}/></button>
                                <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm(t.deleteCompareConfirm)) deleteTool(activeModule.id, tool.id); }}><Trash2 size={11}/></button>
                              </div>}
                            </div>
                            <span className="tool-category">{tool.category}{tool.isPaid ? " · 付费" : " · 免费"}</span>
                            {tool.description && <p style={{fontSize:"0.75rem",color:"#8aa0c8",margin:"0.3rem 0 0"}}>{tool.description}</p>}
                            {tool.url && <a href={tool.url} target="_blank" rel="noreferrer" style={{fontSize:"0.7rem",color:"var(--c-neon)",display:"block",marginTop:"0.25rem"}}>{tool.url}</a>}
                            {tool.tags.length > 0 && <div className="tool-tags" style={{marginTop:"0.3rem"}}>{tool.tags.map(tg => <span key={tg}>{tg}</span>)}</div>}
                          </article>
                        ))}
                      </div>
                    </>
                  );
                  default: return null;
                }
              };
              const tabCfg = (activeModule.enabledTabs ?? []).find(d => d.key === activeDimension);
              const tabLabel = tabCfg?.label ?? activeDimension;
              const WLABEL: Record<string,string> = {knowledge:t.widgetKnowledge,operation:t.widgetOperation,case:t.widgetCase,skill:t.widgetSkill,path:t.widgetPath,interview:t.widgetInterview,career:t.widgetCareer,tool:t.widgetTool,compare:t.widgetCompare};
              return (
                <section key={widget} className="section-block in-shell">
                  <div className="section-title-row">
                    <FileText size={17}/>
                    <h2>{tabLabel}{activeWidgets.filter(w => w !== "compare").length > 1 ? <span style={{fontSize:"0.72rem",color:"#5a7898",marginLeft:"0.4rem",fontWeight:400}}>· {WLABEL[widget] ?? widget}</span> : null}</h2>
                    {isEditMode && addBtns.length > 0 && (
                      <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
                        {addBtns}
                      </div>
                    )}
                  </div>
                  {renderContent()}
                </section>
              );
            })}

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
          moduleData={moduleModal.module ? mergedModules.find(m => m.id === moduleModal.module!.id) : undefined}
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
        {t.footerNote}
      </footer>

      {/* ── Edit controls (fixed top-right) ── */}
      <div className="edit-controls-stack">
        <button
          type="button"
          className="edit-mode-lock-btn"
          title={t.searchShortcut}
          onClick={() => setSearchOpen(true)}
        >
          <Search size={14} />
        </button>
        <button
          type="button"
          className="edit-mode-lock-btn"
          title={isMounted ? t.langToggle : ""}
          onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
          style={{fontSize:"0.65rem",fontWeight:600,letterSpacing:"0.02em"}}
        >
          {isMounted ? (locale === "zh" ? "EN" : "中") : "EN"}
        </button>
        <button
          type="button"
          className="edit-mode-lock-btn"
          title={isMounted ? (isDark ? t.themeLight : t.themeDark) : ""}
          onClick={() => setIsDark(d => !d)}
        >
          {isMounted ? (isDark ? <Sun size={14} /> : <Moon size={14} />) : <Sun size={14} />}
        </button>
        <button
          type="button"
          className={`edit-mode-lock-btn ${isEditMode ? "active" : ""}`}
          title={isEditMode ? t.exitEditMode : t.enterEditMode}
          onClick={requestEdit}
        >
          {isEditMode ? <LockOpen size={15} /> : <Lock size={15} />}
        </button>

        {isEditMode && (
          <button
            type="button"
            className="edit-mode-lock-btn"
            title={t.cleanImages}
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
          moduleData={moduleModal.module ? mergedModules.find(m => m.id === moduleModal.module!.id) : undefined}
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
              <span><Lock size={14}/> {t.passwordPromptTitle}</span>
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
                  placeholder={t.passwordPlaceholder}
                  autoFocus
                />
                {error && <p style={{color:"#f06060",fontSize:"0.72rem",margin:"0.2rem 0 0"}}>{t.passwordError}</p>}
              </div>
            </div>
            <div className="note-modal-footer">
              <span />
              <button type="button" className="note-save-btn note-save-btn-active" onClick={submitPassword}>
                <LockOpen size={13}/> {t.enterEditModeBtn}
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
              <span>{t.exitEditModeTitle}</span>
              <button type="button" className="note-close" onClick={() => { savePrompt.resolve(false); setSavePrompt(null); }}><X size={14}/></button>
            </div>
            <div style={{ padding: "1.2rem 1rem", color: "#a0b8d8", fontSize: "0.85rem", lineHeight: 1.6 }}>
              {t.unsavedChanges}
            </div>
            <div className="note-modal-footer" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", padding: "0 1rem 1rem" }}>
              <button type="button" className="note-save-btn" style={{ background: "rgba(180,40,40,0.15)", borderColor: "rgba(220,80,80,0.3)", color: "#f08080" }}
                onClick={() => { discardDraft(); savePrompt.resolve(true); setSavePrompt(null); }}>
                {t.discardAndExit}
              </button>
              <button type="button" className="note-save-btn note-save-btn-active"
                onClick={() => { commitDraft(mergedModules); savePrompt.resolve(true); setSavePrompt(null); }}>
                {t.saveAndExit}
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
          }}><PenLine size={12}/> {t.ctxEditTab}</button>
          <button type="button" className="module-ctx-item module-ctx-delete" onClick={() => {
            setTabCtxMenu(null);
            if (!confirm(t.ctxDeleteTabConfirm(tabCtxMenu.tab.label))) return;
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
              <span>{tabEditModal.tab ? t.editTab : t.newTab}</span>
              <button type="button" className="note-close" onClick={() => setTabEditModal({ open: false, tab: null })}><X size={14}/></button>
            </div>
            <div className="note-edit-body">
              <TabLabelEditor
                init={tabEditModal.tab}
                isBuiltin={tabEditModal.tab ? ALL_TABS.some(t => t.key === tabEditModal.tab!.key) : false}
                moduleData={activeModule}
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
            if (confirm(t.deleteModuleConfirm(mod.name))) {
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
        title={t.clearCache}
        onClick={() => {
          if (confirm(t.clearCacheConfirm)) {
            localStorage.removeItem("aishow_content_store");
            location.reload();
          }
        }}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 999,
        }}
        className="refresh-fab"
      >
        <RefreshCw size={14} />
      </button>

      {/* ── Global Search Overlay ── */}
      {searchOpen && createPortal(
        <div className="search-overlay" onClick={closeSearch}>
          <div className="search-panel" onClick={e => e.stopPropagation()}>
            <div className="search-input-row">
              <Search size={16} style={{color:"var(--muted)",flexShrink:0}} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchCursor(-1); }}
                onKeyDown={handleSearchKeyDown}
                placeholder={t.searchPlaceholder}
              />
              {searchQuery && <button type="button" onClick={() => { setSearchQuery(""); setSearchCursor(-1); }} style={{appearance:"none",background:"none",border:"none",color:"var(--muted)",cursor:"pointer",padding:0}}><X size={14}/></button>}
            </div>
            {searchQuery.trim() !== "" && searchResults.length > 0 && (
              <div style={{padding:"0.25rem 0.9rem 0",fontSize:"0.68rem",color:"var(--muted)",display:"flex",justifyContent:"space-between"}}>
                <span>{searchResults.length} 条结果</span>
                <span style={{opacity:0.5}}>↑↓ 导航 · Enter 跳转 · Esc 关闭</span>
              </div>
            )}
            <div className="search-results" ref={searchResultsRef}>
              {searchQuery.trim() === "" && (
                <div className="search-empty">{t.searchEmpty}<br/><span style={{fontSize:"0.7rem",opacity:0.5}}>{t.searchShortcutHint}</span></div>
              )}
              {searchQuery.trim() !== "" && searchResults.length === 0 && (
                <div className="search-empty">{t.searchNoResult(searchQuery)}</div>
              )}
              {searchResults.map((r, i) => {
                const hi = (s: string) => {
                  const idx = s.toLowerCase().indexOf(searchQuery.toLowerCase());
                  if (idx === -1) return s;
                  return <>{s.slice(0, idx)}<mark>{s.slice(idx, idx + searchQuery.length)}</mark>{s.slice(idx + searchQuery.length)}</>;
                };
                return (
                  <div key={i}
                    className={`search-result-item${i === searchCursor ? " search-result-active" : ""}`}
                    onClick={() => jumpToResult(r)}
                    onMouseEnter={() => setSearchCursor(i)}
                  >
                    <div style={{display:"flex",alignItems:"center",gap:"0.45rem"}}>
                      <span style={{fontSize:"0.6rem",fontWeight:600,padding:"0.05rem 0.35rem",borderRadius:"3px",background:"rgba(80,140,220,0.18)",color:"#6ab0f5",flexShrink:0,letterSpacing:"0.02em"}}>{r.type}</span>
                      <div className="search-result-title">{hi(r.title)}</div>
                    </div>
                    <div className="search-result-meta">{r.moduleName} · {r.tabLabel}{r.subtitle ? ` · ${r.subtitle.slice(0,50)}` : ""}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
