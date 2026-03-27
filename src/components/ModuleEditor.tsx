"use client";
import { useState, useEffect, useRef } from "react";
import { X, Save, Trash2, Plus, LayoutGrid } from "lucide-react";
import type { LearningModule, DimensionTab, TabConfig, TabWidget } from "@/data/types";
import { useI18n } from "@/lib/i18n";

const ICONS = ["📚","🔍","⚙️","🚀","🤖","🧠","💡","🎯","📊","🛠️","🌐","💼","🔬","📝","🎨","⚡"];

export const ALL_WIDGETS: { key: TabWidget; label: string; desc: string }[] = [
  { key: "knowledge", label: "知识点卡片",     desc: "概念卡片，含隐喻、要点、颜色" },
  { key: "operation", label: "操作步骤卡片",   desc: "动手操作步骤，含工具" },
  { key: "case",      label: "案例卡片",       desc: "场景-问题-方案-结果" },
  { key: "skill",     label: "能力雷达项",     desc: "技能维度与升级路径" },
  { key: "path",      label: "成长路径节点",   desc: "前置条件、时长、提示" },
  { key: "interview", label: "面试题",         desc: "题目、框架、要点、参考答案" },
  { key: "career",    label: "职业规划里程碑", desc: "阶段、行动、交付物" },
  { key: "tool",      label: "工具卡片",       desc: "工具名称、类别、链接" },
  { key: "compare",   label: "对比组件",       desc: "多列横向对比表格" },
];

export const ALL_TABS: TabConfig[] = [
  { key: "knowledge",  label: "知识点",   widgets: ["knowledge", "compare"] },
  { key: "operation",  label: "操作点",   widgets: ["operation", "compare"] },
  { key: "skills",     label: "能力雷达", widgets: ["skill", "compare"] },
  { key: "path",       label: "成长路径", widgets: ["path", "compare"] },
  { key: "interview",  label: "面试准备", widgets: ["interview", "compare"] },
  { key: "career",     label: "职业规划", widgets: ["career", "compare"] },
  { key: "tools",      label: "工具",     widgets: ["tool", "compare"] },
  { key: "cases",      label: "案例",     widgets: ["case", "compare"] },
];

function genModuleId() {
  return "module-" + Math.random().toString(36).slice(2, 8);
}

// ── Module Editor Modal (edit name/icon/intro/enabledTabs) ──
interface ModuleEditorModalProps {
  module: LearningModule | null; // null = new
  moduleData?: LearningModule;   // merged module for counting
  onSave: (fields: Pick<LearningModule, "id" | "name" | "icon" | "intro" | "enabledTabs">) => void;
  onDelete?: () => void;
  onClose: () => void;
}

// Each row in the tab order list
interface TabRow {
  tab: TabConfig;
  enabled: boolean;
}

export function ModuleEditorModal({ module, moduleData, onSave, onDelete, onClose }: ModuleEditorModalProps) {
  const isNew = module === null;
  const { t } = useI18n();

  const TAB_LABEL_MAP: Record<string, string> = {
    knowledge: t.tabKnowledge, operation: t.tabOperation, skills: t.tabSkills,
    path: t.tabPath, interview: t.tabInterview, career: t.tabCareer,
    tools: t.tabTools, cases: t.tabCases,
  };

  const [name, setName] = useState(module?.name ?? "");
  const [icon, setIcon] = useState(module?.icon ?? "📚");
  const [intro, setIntro] = useState(module?.intro ?? "");
  const [customIcon, setCustomIcon] = useState("");
  const [newTabLabel, setNewTabLabel] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  // Count items for a given tab key in the merged module
  const countForTab = (key: string): number => {
    if (!moduleData) return 0;
    let n = 0;
    n += moduleData.knowledgeNodes.filter(i => (i.dimensionTab ?? "knowledge") === key).length;
    n += moduleData.operationSteps.filter(i => (i.dimensionTab ?? "operation") === key).length;
    n += (moduleData.cases ?? []).filter(i => (i.dimensionTab ?? "cases") === key).length;
    n += (moduleData.tools ?? []).filter(i => (i.dimensionTab ?? "tools") === key).length;
    n += (moduleData.skills ?? []).filter(i => (i.dimensionTab ?? "skills") === key).length;
    n += (moduleData.learningPath ?? []).filter(i => (i.dimensionTab ?? "path") === key).length;
    n += (moduleData.interviewQuestions ?? []).filter(i => (i.dimensionTab ?? "interview") === key).length;
    n += (moduleData.careerPlan ?? []).filter(i => (i.dimensionTab ?? "career") === key).length;
    return n;
  };

  // Build unified tab rows: all ALL_TABS + any custom tabs, in user-defined order
  const initRows = (): TabRow[] => {
    const saved = module?.enabledTabs;
    if (!saved) {
      // Default: all builtin tabs enabled
      return ALL_TABS.map(t => ({ tab: t, enabled: true }));
    }
    // Start with saved order (all enabled)
    const rows: TabRow[] = saved.map(t => ({ tab: t, enabled: true }));
    // Append any builtin tabs not in saved (disabled)
    ALL_TABS.forEach(t => {
      if (!rows.some(r => r.tab.key === t.key)) {
        rows.push({ tab: t, enabled: false });
      }
    });
    return rows;
  };
  const [tabRows, setTabRows] = useState<TabRow[]>(initRows);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 60);
  }, []);

  const toggleTab = (key: DimensionTab) => {
    setTabRows(prev => prev.map(r => r.tab.key === key ? { ...r, enabled: !r.enabled } : r));
  };

  const moveTab = (idx: number, dir: -1 | 1) => {
    setTabRows(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const removeCustomTab = (key: DimensionTab) => {
    setTabRows(prev => prev.filter(r => r.tab.key !== key));
  };

  const addCustomTab = () => {
    const label = newTabLabel.trim();
    if (!label) return;
    const key = "custom-" + label.replace(/\s+/g, "-").toLowerCase() + "-" + Math.random().toString(36).slice(2, 5);
    setTabRows(prev => [...prev, { tab: { key, label }, enabled: true }]);
    setNewTabLabel("");
  };

  const handleSave = () => {
    if (!name.trim()) { nameRef.current?.focus(); return; }
    const enabledTabs = tabRows.filter(r => r.enabled).map(r => r.tab);
    if (enabledTabs.length === 0) { alert(t.enabledTabsMin); return; }
    onSave({
      id: module?.id ?? genModuleId(),
      name: name.trim(),
      icon: customIcon.trim() || icon,
      intro: intro.trim(),
      enabledTabs,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirm(t.deleteModuleConfirm(module?.name ?? ""))) return;
    onDelete?.();
    onClose();
  };

  return (
    <div className="note-overlay" onClick={onClose}>
      <div className="note-modal note-modal-wide" onClick={e => e.stopPropagation()}>

        <div className="note-modal-header">
          <span><LayoutGrid size={14} /> {isNew ? t.newModule : t.editModule(module.name)}</span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {!isNew && onDelete && (
              <button type="button" className="note-delete-btn" onClick={handleDelete}>
                <Trash2 size={13} /> {t.deleteModule}
              </button>
            )}
            <button type="button" className="note-close" onClick={onClose}><X size={14} /></button>
          </div>
        </div>

        <div className="note-edit-body">
          <div className="note-field">
            <label className="note-label">{t.moduleName} <span style={{color:"#f06060"}}>*</span></label>
            <input ref={nameRef} className="note-input" value={name} onChange={e => setName(e.target.value)} placeholder={t.moduleNamePlaceholder} />
          </div>

          <div className="note-field">
            <label className="note-label">{t.moduleIntro}</label>
            <textarea className="note-textarea" value={intro} onChange={e => setIntro(e.target.value)} rows={2} placeholder={t.moduleIntroPlaceholder} />
          </div>

          <div className="note-field">
            <label className="note-label">{t.moduleIcon}</label>
            <div className="module-icon-grid">
              {ICONS.map(ic => (
                <button key={ic} type="button"
                  className={`module-icon-btn ${icon === ic && !customIcon ? "active" : ""}`}
                  onClick={() => { setIcon(ic); setCustomIcon(""); }}
                >{ic}</button>
              ))}
            </div>
            <input
              className="note-input"
              style={{ marginTop: "0.4rem" }}
              value={customIcon}
              onChange={e => setCustomIcon(e.target.value)}
              placeholder={t.moduleIconCustomPlaceholder}
              maxLength={4}
            />
          </div>

          <div className="note-field">
            <label className="note-label">{t.enabledTabs} <span style={{color:"#8aaccc",fontWeight:400}}>{t.enabledTabsHint}</span></label>
            <div style={{display:"flex",flexDirection:"column",gap:"0.25rem"}}>
              {tabRows.map((row, idx) => {
                const isCustom = !ALL_TABS.some(t => t.key === row.tab.key);
                return (
                  <div key={row.tab.key} style={{
                    display:"flex",alignItems:"center",gap:"0.4rem",
                    background: row.enabled ? "rgba(40,70,120,0.22)" : "rgba(20,35,60,0.12)",
                    border: `1px solid ${row.enabled ? "rgba(80,130,220,0.28)" : "rgba(60,90,140,0.15)"}`,
                    borderRadius:"7px",padding:"0.28rem 0.55rem",
                    opacity: row.enabled ? 1 : 0.5,
                    transition:"opacity 0.15s,background 0.15s"
                  }}>
                    <input type="checkbox" checked={row.enabled}
                      onChange={() => toggleTab(row.tab.key)}
                      style={{accentColor:"var(--c-neon)",cursor:"pointer",width:"13px",height:"13px",flexShrink:0}}
                    />
                    <span style={{flex:1,fontSize:"0.78rem",color: row.enabled ? "#a0c4f0" : "#5a7898"}}>
                      <span style={{color:"#4a6888",marginRight:"0.4rem",fontVariantNumeric:"tabular-nums",fontSize:"0.7rem"}}>{String(idx+1).padStart(2,"0")}</span>
                      {TAB_LABEL_MAP[row.tab.key] ?? row.tab.label}
                      {isCustom && <span style={{fontSize:"0.65rem",color:"#5a7898",marginLeft:"0.3rem"}}>{t.customLabel}</span>}
                      {(() => { const c = countForTab(row.tab.key); return c > 0 ? <span style={{fontSize:"0.65rem",color:"#4a8898",marginLeft:"0.35rem",fontVariantNumeric:"tabular-nums"}}>{t.items(c)}</span> : null; })()}
                    </span>
                    <button type="button" disabled={idx === 0}
                      onClick={() => moveTab(idx, -1)}
                      style={{appearance:"none",background:"none",border:"none",color: idx===0?"#2a4060":"#7aaad0",cursor:idx===0?"default":"pointer",padding:"0 0.1rem",lineHeight:1,fontSize:"0.8rem"}}
                      title={t.moveUp}
                    >▲</button>
                    <button type="button" disabled={idx === tabRows.length - 1}
                      onClick={() => moveTab(idx, 1)}
                      style={{appearance:"none",background:"none",border:"none",color: idx===tabRows.length-1?"#2a4060":"#7aaad0",cursor:idx===tabRows.length-1?"default":"pointer",padding:"0 0.1rem",lineHeight:1,fontSize:"0.8rem"}}
                      title={t.moveDown}
                    >▼</button>
                    {isCustom && (
                      <button type="button" onClick={() => removeCustomTab(row.tab.key)}
                        style={{appearance:"none",background:"none",border:"none",color:"#f08080",cursor:"pointer",padding:"0 0.1rem",lineHeight:1,fontSize:"0.85rem"}}
                        title={t.deleteCustomTab}
                      >×</button>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:"0.4rem",marginTop:"0.5rem"}}>
              <input className="note-input" style={{flex:1}} value={newTabLabel}
                onChange={e => setNewTabLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomTab(); } }}
                placeholder={t.customTabPlaceholder} />
              <button type="button" className="section-add-btn" onClick={addCustomTab}><Plus size={12}/> {t.addCustomTab}</button>
            </div>
            <span style={{fontSize:"0.72rem",color:"#5a7898",marginTop:"0.3rem",display:"block"}}>
              {t.tabFooterHint}
            </span>
          </div>
        </div>

        <div className="note-modal-footer">
          <span className="note-hint">{isNew ? t.newModuleHint : t.editModuleHint}</span>
          <button type="button" className="note-save-btn note-save-btn-active" onClick={handleSave}>
            <Save size={13} /> {isNew ? t.createModule : t.saveChanges}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Add Module Button ──
export function AddModuleButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="add-module-btn" title="新增模块" onClick={onClick}
      style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Plus size={13} />
    </button>
  );
}
