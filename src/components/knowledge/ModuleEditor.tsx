"use client";
import { useState, useEffect, useRef } from "react";
import { X, Save, Trash2, Plus, LayoutGrid } from "lucide-react";
import type { LearningModule, DimensionTab, TabConfig, TabWidget } from "@/data/types";
import { MODULE_ICONS } from "@/data/constants";
import { WIDGET_MODULE_MAP, TAB_WIDGET, FIELD_DEFAULT_TAB, TAB_LABEL_MAP } from "@/data/types";
import { TAB_FIELD_MAP } from "@/lib/useContentStore";
import { useI18n } from "@/lib/i18n";

// Widget descriptions derived from WIDGET_MODULE_MAP — no manual maintenance needed
export const ALL_WIDGETS: { key: TabWidget; label: string; desc: string }[] = [
  ...WIDGET_MODULE_MAP.map(e => ({ key: e.widget, label: e.typeLabel, desc: e.desc })),
  { key: TAB_WIDGET.Compare, label: "Compare Block", desc: "Multi-column comparison table" },
];

// Default built-in tabs derived from WIDGET_MODULE_MAP
export const ALL_TABS: TabConfig[] = WIDGET_MODULE_MAP.map(e => ({
  key: e.defaultTab,
  label: e.typeLabel,
  widgets: e.widget === TAB_WIDGET.Knowledge
    ? [TAB_WIDGET.Knowledge, TAB_WIDGET.Compare] as TabWidget[]
    : [e.widget, TAB_WIDGET.Compare] as TabWidget[],
}));

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

  // TAB_LABEL_MAP imported from @/data/types

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
    for (const [tabKey, field] of Object.entries(TAB_FIELD_MAP)) {
      const items = (moduleData[field] ?? []) as { dimensionTab?: string }[];
      n += items.filter(i => (i.dimensionTab ?? tabKey) === key).length;
    }
    // knowledge nodes
    n += moduleData.knowledgeNodes.filter(i => (i.dimensionTab ?? FIELD_DEFAULT_TAB["knowledgeNodes"]) === key).length;
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
          <div className="flex gap-2">
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
            <label className="note-label">{t.moduleName} <span className="text-red-400">*</span></label>
            <input ref={nameRef} className="note-input" value={name} onChange={e => setName(e.target.value)} placeholder={t.moduleNamePlaceholder} />
          </div>

          <div className="note-field">
            <label className="note-label">{t.moduleIntro}</label>
            <textarea className="note-textarea" value={intro} onChange={e => setIntro(e.target.value)} rows={2} placeholder={t.moduleIntroPlaceholder} />
          </div>

          <div className="note-field">
            <label className="note-label">{t.moduleIcon}</label>
            <div className="module-icon-grid">
              {MODULE_ICONS.map(ic => (
                <button key={ic} type="button"
                  className={`module-icon-btn ${icon === ic && !customIcon ? "active" : ""}`}
                  onClick={() => { setIcon(ic); setCustomIcon(""); }}
                >{ic}</button>
              ))}
            </div>
            <input
              className="note-input mt-1"
              value={customIcon}
              onChange={e => setCustomIcon(e.target.value)}
              placeholder={t.moduleIconCustomPlaceholder}
              maxLength={4}
            />
          </div>

          <div className="note-field">
            <label className="note-label">{t.enabledTabs} <span className="text-[#8aaccc] font-normal">{t.enabledTabsHint}</span></label>
            <div className="flex flex-col gap-1">
              {tabRows.map((row, idx) => {
                const isCustom = !ALL_TABS.some(t => t.key === row.tab.key);
                return (
                  <div key={row.tab.key} className={`flex items-center gap-2 p-2 rounded-lg transition-all ${row.enabled ? "bg-[rgba(40,70,120,0.22)] border border-[rgba(80,130,220,0.28)] opacity-100" : "bg-[rgba(20,35,60,0.12)] border border-[rgba(60,90,140,0.15)] opacity-50"}`}>
                    <input type="checkbox" checked={row.enabled}
                      onChange={() => toggleTab(row.tab.key)}
                      className="shrink-0 w-3 h-3 accent-[var(--c-neon)] cursor-pointer"
                    />
                    <span className="flex-1 text-[0.78rem]" style={{ color: row.enabled ? "#a0c4f0" : "#5a7898" }}>
                      <span className="text-[#4a6888] mr-1 font-variant-numeric: tabular-nums text-[0.7rem]">{String(idx+1).padStart(2,"0")}</span>
                      {TAB_LABEL_MAP[row.tab.key] ?? row.tab.label}
                      {isCustom && <span className="text-[0.65rem] text-[#5a7898] ml-1">{t.customLabel}</span>}
                      {(() => { const c = countForTab(row.tab.key); return c > 0 ? <span className="text-[0.65rem] text-[#4a8898] ml-1 font-variant-numeric: tabular-nums">{t.items(c)}</span> : null; })()}
                    </span>
                    <button type="button" disabled={idx === 0}
                      onClick={() => moveTab(idx, -1)}
                      className={`appearance-none bg-transparent border-none text-[0.8rem] leading-1 p-0 ${idx === 0 ? "text-[#2a4060] cursor-default" : "text-[#7aaad0] cursor-pointer"}`}
                      title={t.moveUp}
                    >▲</button>
                    <button type="button" disabled={idx === tabRows.length - 1}
                      onClick={() => moveTab(idx, 1)}
                      className={`appearance-none bg-transparent border-none text-[0.8rem] leading-1 p-0 ${idx === tabRows.length - 1 ? "text-[#2a4060] cursor-default" : "text-[#7aaad0] cursor-pointer"}`}
                      title={t.moveDown}
                    >▼</button>
                    {isCustom && (
                      <button type="button" onClick={() => removeCustomTab(row.tab.key)}
                        className="appearance-none bg-transparent border-none text-[#f08080] cursor-pointer text-[0.85rem] leading-1 p-0"
                        title={t.deleteCustomTab}
                      >×</button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <input className="note-input flex-1" value={newTabLabel}
                onChange={e => setNewTabLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomTab(); } }}
                placeholder={t.customTabPlaceholder} />
              <button type="button" className="section-add-btn" onClick={addCustomTab}><Plus size={12}/> {t.addCustomTab}</button>
            </div>
            <span className="text-[0.72rem] text-[#5a7898] mt-1 block">
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
  const { t } = useI18n();
  return (
    <button type="button" className="add-module-btn flex items-center justify-center" title={t.addModule} onClick={onClick}>
      <Plus size={13} />
    </button>
  );
}
