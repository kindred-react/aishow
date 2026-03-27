"use client";
import { useState, useEffect, useRef } from "react";
import { X, Save, Trash2, Plus, LayoutGrid } from "lucide-react";
import type { LearningModule, DimensionTab, TabConfig, TabWidget } from "@/data/types";

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
  onSave: (fields: Pick<LearningModule, "id" | "name" | "icon" | "intro" | "enabledTabs">) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ModuleEditorModal({ module, onSave, onDelete, onClose }: ModuleEditorModalProps) {
  const isNew = module === null;
  const [name, setName] = useState(module?.name ?? "");
  const [icon, setIcon] = useState(module?.icon ?? "📚");
  const [intro, setIntro] = useState(module?.intro ?? "");
  const [customIcon, setCustomIcon] = useState("");
  const [enabledTabs, setEnabledTabs] = useState<TabConfig[]>(
    module?.enabledTabs ?? ALL_TABS
  );
  const [newTabLabel, setNewTabLabel] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 60);
  }, []);

  const toggleBuiltinTab = (key: DimensionTab) => {
    setEnabledTabs(prev =>
      prev.some(t => t.key === key)
        ? prev.filter(t => t.key !== key)
        : [...prev, ALL_TABS.find(t => t.key === key)!]
    );
  };

  const removeTab = (key: DimensionTab) => {
    setEnabledTabs(prev => prev.filter(t => t.key !== key));
  };

  const addCustomTab = () => {
    const label = newTabLabel.trim();
    if (!label) return;
    const key = "custom-" + label.replace(/\s+/g, "-").toLowerCase() + "-" + Math.random().toString(36).slice(2, 5);
    setEnabledTabs(prev => [...prev, { key, label }]);
    setNewTabLabel("");
  };

  const handleSave = () => {
    if (!name.trim()) { nameRef.current?.focus(); return; }
    if (enabledTabs.length === 0) { alert("至少需要启用一个 Tab"); return; }
    // Keep builtin tabs in original order, then custom tabs at end
    const builtinOrder = ALL_TABS.map(t => t.key);
    const sorted = [
      ...builtinOrder.map(k => enabledTabs.find(t => t.key === k)).filter(Boolean) as TabConfig[],
      ...enabledTabs.filter(t => !builtinOrder.includes(t.key)),
    ];
    onSave({
      id: module?.id ?? genModuleId(),
      name: name.trim(),
      icon: customIcon.trim() || icon,
      intro: intro.trim(),
      enabledTabs: sorted,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirm(`确定删除模块「${module?.name}」？该模块下的所有卡片将一并删除。`)) return;
    onDelete?.();
    onClose();
  };

  return (
    <div className="note-overlay" onClick={onClose}>
      <div className="note-modal note-modal-wide" onClick={e => e.stopPropagation()}>

        <div className="note-modal-header">
          <span><LayoutGrid size={14} /> {isNew ? "新增模块" : `编辑模块：${module.name}`}</span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {!isNew && onDelete && (
              <button type="button" className="note-delete-btn" onClick={handleDelete}>
                <Trash2 size={13} /> 删除模块
              </button>
            )}
            <button type="button" className="note-close" onClick={onClose}><X size={14} /></button>
          </div>
        </div>

        <div className="note-edit-body">
          <div className="note-field">
            <label className="note-label">模块名称 <span style={{color:"#f06060"}}>*</span></label>
            <input ref={nameRef} className="note-input" value={name} onChange={e => setName(e.target.value)} placeholder="如：深度学习基础" />
          </div>

          <div className="note-field">
            <label className="note-label">模块简介</label>
            <textarea className="note-textarea" value={intro} onChange={e => setIntro(e.target.value)} rows={2} placeholder="一句话描述这个模块的内容" />
          </div>

          <div className="note-field">
            <label className="note-label">图标</label>
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
              placeholder="或输入自定义 Emoji"
              maxLength={4}
            />
          </div>

          <div className="note-field">
            <label className="note-label">启用的 Tab <span style={{color:"#8aaccc",fontWeight:400}}>（至少选一个）</span></label>
            <div className="node-level-btns" style={{flexWrap:"wrap",gap:"0.35rem"}}>
              {ALL_TABS.map(t => (
                <button key={t.key} type="button"
                  className={`node-level-btn ${enabledTabs.some(e => e.key === t.key) ? "active" : ""}`}
                  onClick={() => toggleBuiltinTab(t.key)}
                >{t.label}</button>
              ))}
            </div>
            {/* Custom tabs */}
            {enabledTabs.filter(t => !ALL_TABS.some(b => b.key === t.key)).length > 0 && (
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem",marginTop:"0.4rem"}}>
                {enabledTabs.filter(t => !ALL_TABS.some(b => b.key === t.key)).map(t => (
                  <span key={t.key} style={{display:"inline-flex",alignItems:"center",gap:"0.25rem",background:"rgba(60,100,200,0.15)",border:"1px solid rgba(80,130,220,0.3)",borderRadius:"5px",padding:"0.2rem 0.45rem",fontSize:"0.75rem",color:"#a0c4f0"}}>
                    {t.label}
                    <button type="button" onClick={() => removeTab(t.key)} style={{appearance:"none",background:"none",border:"none",color:"#f08080",cursor:"pointer",padding:0,lineHeight:1}}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:"0.4rem",marginTop:"0.4rem"}}>
              <input className="note-input" style={{flex:1}} value={newTabLabel}
                onChange={e => setNewTabLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomTab(); } }}
                placeholder="新增自定义 Tab 名称，回车确认" />
              <button type="button" className="section-add-btn" onClick={addCustomTab}><Plus size={12}/> 添加</button>
            </div>
            <span style={{fontSize:"0.72rem",color:"#5a7898",marginTop:"0.3rem",display:"block"}}>
              内置 Tab 点击切换，也可新增自定义 Tab
            </span>
          </div>
        </div>

        <div className="note-modal-footer">
          <span className="note-hint">{isNew ? "新模块将添加到模块列表末尾" : "修改立即生效"}</span>
          <button type="button" className="note-save-btn note-save-btn-active" onClick={handleSave}>
            <Save size={13} /> {isNew ? "创建模块" : "保存修改"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Add Module Button ──
export function AddModuleButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="add-module-btn" onClick={onClick}>
      <Plus size={13} /> 新增模块
    </button>
  );
}
