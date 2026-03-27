"use client";
import { useState, useEffect, useRef } from "react";
import { X, Save, Trash2, Plus, LayoutGrid } from "lucide-react";
import type { LearningModule } from "@/data/types";

const ICONS = ["📚","🔍","⚙️","🚀","🤖","🧠","💡","🎯","📊","🛠️","🌐","💼","🔬","📝","🎨","⚡"];

function genModuleId() {
  return "module-" + Math.random().toString(36).slice(2, 8);
}

// ── Module Editor Modal (edit name/icon/intro) ──
interface ModuleEditorModalProps {
  module: LearningModule | null; // null = new
  onSave: (fields: Pick<LearningModule, "id" | "name" | "icon" | "intro">) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ModuleEditorModal({ module, onSave, onDelete, onClose }: ModuleEditorModalProps) {
  const isNew = module === null;
  const [name, setName] = useState(module?.name ?? "");
  const [icon, setIcon] = useState(module?.icon ?? "📚");
  const [intro, setIntro] = useState(module?.intro ?? "");
  const [customIcon, setCustomIcon] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 60);
  }, []);

  const handleSave = () => {
    if (!name.trim()) { nameRef.current?.focus(); return; }
    onSave({
      id: module?.id ?? genModuleId(),
      name: name.trim(),
      icon: customIcon.trim() || icon,
      intro: intro.trim(),
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
