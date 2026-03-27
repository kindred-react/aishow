"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import {
  ChevronUp, ChevronDown, X, Save, Trash2,
  Plus, Pencil, BarChart2, GripVertical, Minus,
} from "lucide-react";
import type { CompareBlock, CompareItem } from "@/data/types";

const PALETTE = [
  { color: "var(--c-cyan)",   accent: "rgba(102,201,255,0.10)" },
  { color: "var(--c-lime)",   accent: "rgba(176,255,112,0.10)" },
  { color: "var(--c-neon)",   accent: "rgba(99,243,255,0.10)"  },
  { color: "var(--c-violet)", accent: "rgba(158,141,255,0.10)" },
  { color: "var(--c-orange)", accent: "rgba(255,180,84,0.10)"  },
  { color: "var(--c-pink)",   accent: "rgba(255,128,191,0.10)" },
];

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─────────────────────────────────────────────────────────
// CompareBlockView  –  read-only display
// ─────────────────────────────────────────────────────────
interface CompareBlockViewProps {
  block: CompareBlock;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CompareBlockView({ block, onEdit, onDelete }: CompareBlockViewProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="apc-root">
      <div className="cb-header-row">
        <div className="apc-table-header cb-header-toggle" onClick={() => setExpanded(v => !v)}>
          <span>{block.title}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {(onEdit || onDelete) && (
          <div className="cb-header-actions">
            {onEdit && (
              <button type="button" className="cb-action-btn" title={t.editCompareHeaderTitle} onClick={onEdit}>
                <Pencil size={12} />
              </button>
            )}
            {onDelete && (
              <button type="button" className="cb-action-btn cb-action-del" title={t.deleteCompareHeaderTitle}
                onClick={() => { if (confirm(t.deleteCompareBlockConfirm(block.title))) onDelete(); }}>
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div key="cb-body"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            {block.rows.length > 0 && (
              <div className="apc-table-wrap">
                <table className="apc-table">
                  <thead>
                    <tr>
                      <th>维度</th>
                      {block.items.map(item => (
                        <th key={item.id} style={{ color: item.color }}>
                          {item.name}
                          {item.nameEn && <span className="apc-th-en">{item.nameEn}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map(row => (
                      <tr key={row.key}>
                        <td className="apc-row-label">{row.label}</td>
                        {block.items.map(item => (
                          <td key={item.id}>{item.tags[row.key] ?? "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="apc-cards"
              style={{ gridTemplateColumns: `repeat(${Math.min(block.items.length, 6)}, 1fr)`, marginTop: "0.6rem" }}
            >
              {block.items.map((item, i) => (
                <motion.article key={item.id}
                  className="apc-card apc-card-open"
                  style={{ borderColor: item.color, background: item.accent ?? "transparent" }}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.28 }}
                >
                  <div className="apc-card-header">
                    <div className="apc-card-title">
                      <strong style={{ color: item.color }}>{item.name}</strong>
                      {item.nameEn && <span className="apc-card-en">{item.nameEn}</span>}
                    </div>
                  </div>
                  {item.flow && item.flow.length > 0 && (
                    <div className="apc-flow">
                      {item.flow.map((step, idx) => (
                        <span key={idx} className="apc-flow-step">
                          {step}
                          {idx < item.flow!.length - 1 && <span className="apc-flow-arrow">→</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.keyPoints && item.keyPoints.length > 0 && (
                    <div className="apc-detail">
                      <ul className="apc-key-points">
                        {item.keyPoints.map((pt, j) => <li key={j}>{pt}</li>)}
                      </ul>
                    </div>
                  )}
                </motion.article>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CompareBlockEditor  –  CRUD modal
// ─────────────────────────────────────────────────────────
interface CompareBlockEditorProps {
  block: CompareBlock | null;
  moduleId: string;
  dimensionTab: string;
  onSave: (block: CompareBlock) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function CompareBlockEditor({ block, moduleId, dimensionTab, onSave, onDelete, onClose }: CompareBlockEditorProps) {
  const { t } = useI18n();
  const isNew = block === null;
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(block?.title ?? "");
  const [rows, setRows] = useState<{ label: string; key: string }[]>(
    block?.rows.length ? block.rows : [{ label: "", key: "row_0" }]
  );
  const [items, setItems] = useState<CompareItem[]>(
    block?.items.length
      ? block.items
      : [{ id: genId(), name: "", nameEn: "", color: PALETTE[0].color, accent: PALETTE[0].accent, tags: {}, flow: [], keyPoints: [] }]
  );
  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const [titleError, setTitleError] = useState(false);

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 60); }, []);

  // row helpers
  const updateRow = (idx: number, field: "label" | "key", val: string) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  const addRow = () => setRows(prev => [...prev, { label: "", key: `row_${prev.length}` }]);
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

  // item helpers
  const addItem = () => {
    const p = PALETTE[items.length % PALETTE.length];
    const newItem: CompareItem = { id: genId(), name: "", nameEn: "", color: p.color, accent: p.accent, tags: {}, flow: [], keyPoints: [] };
    setItems(prev => [...prev, newItem]);
    setActiveItemIdx(items.length);
  };
  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    setActiveItemIdx(i => Math.max(0, i >= idx ? i - 1 : i));
  };
  const updateItem = (idx: number, fields: Partial<CompareItem>) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...fields } : it));
  const updateTag = (itemIdx: number, key: string, val: string) =>
    setItems(prev => prev.map((it, i) => i === itemIdx ? { ...it, tags: { ...it.tags, [key]: val } } : it));

  const handleSave = () => {
    if (!title.trim()) { setTitleError(true); titleRef.current?.focus(); return; }
    onSave({
      id: block?.id ?? genId(),
      moduleId,
      dimensionTab,
      title: title.trim(),
      rows: rows.filter(r => r.label.trim() && r.key.trim()),
      items,
      order: block?.order ?? Date.now(),
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirm(t.deleteCompareBlockFullConfirm(block?.title ?? ""))) return;
    onDelete?.(); onClose();
  };

  const activeItem = items[activeItemIdx];

  return (
    <div className="note-overlay" onClick={onClose}>
      <div className="note-modal cb-editor-modal" onClick={e => e.stopPropagation()}>

        <div className="note-modal-header">
          <span><BarChart2 size={14} /> {isNew ? t.addCompareBtn : t.editCompareTitle(block.title)}</span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {!isNew && onDelete && (
              <button type="button" className="note-delete-btn" onClick={handleDelete}><Trash2 size={13} /> {t.deleteCompareBtn}</button>
            )}
            <button type="button" className="note-close" onClick={onClose}><X size={14} /></button>
          </div>
        </div>

        <div className="cb-editor-body">

          {/* LEFT: title + rows + item tabs */}
          <div className="cb-editor-left">
            <div className="note-field">
              <label className="note-label">标题 <span style={{ color:"#f06060" }}>*</span></label>
              <input ref={titleRef}
                className={`note-input ${titleError ? "note-input-error" : ""}`}
                value={title} onChange={e => { setTitle(e.target.value); setTitleError(false); }}
                placeholder="如：六种算法横向对比" />
            </div>

            <div className="note-field">
              <div className="note-label-row">
                <label className="note-label">{t.compareDimensions}</label>
                <button type="button" className="note-add-point" onClick={addRow}><Plus size={11} /> {t.fieldAdd}</button>
              </div>
              <div className="cb-rows-list">
                {rows.map((row, idx) => (
                  <div key={idx} className="cb-row-item">
                    <GripVertical size={12} className="cb-grip" />
                    <input className="note-input cb-row-input" placeholder="维度名 如：类别"
                      value={row.label} onChange={e => updateRow(idx, "label", e.target.value)} />
                    <input className="note-input cb-row-input cb-row-key" placeholder="key"
                      value={row.key} onChange={e => updateRow(idx, "key", e.target.value.replace(/\s/g,"_"))} />
                    <button type="button" className="note-remove-point" onClick={() => removeRow(idx)}><Minus size={11} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="note-field">
              <div className="note-label-row">
                <label className="note-label">对比项（卡片列）</label>
                <button type="button" className="note-add-point" onClick={addItem}><Plus size={11} /> {t.fieldAdd}</button>
              </div>
              <div className="cb-item-tabs">
                {items.map((item, idx) => (
                  <div key={item.id} className="cb-item-tab-wrap">
                    <button type="button"
                      className={`cb-item-tab ${activeItemIdx === idx ? "active" : ""}`}
                      style={{ borderColor: activeItemIdx === idx ? item.color : undefined }}
                      onClick={() => setActiveItemIdx(idx)}
                    >
                      <span className="cb-item-tab-dot" style={{ background: item.color }} />
                      {item.name || `项目 ${idx + 1}`}
                    </button>
                    {items.length > 1 && (
                      <button type="button" className="cb-item-tab-del" onClick={() => removeItem(idx)} title={t.deleteCompareBtn}>
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: active item details */}
          {activeItem && (
            <div className="cb-editor-right">
              <div className="note-field">
                <label className="note-label">名称 <span style={{ color:"#f06060" }}>*</span></label>
                <input className="note-input" placeholder="如：线性回归"
                  value={activeItem.name}
                  onChange={e => updateItem(activeItemIdx, { name: e.target.value })} />
              </div>
              <div className="note-field">
                <label className="note-label">副标题 / 英文名</label>
                <input className="note-input" placeholder="如：Linear Regression"
                  value={activeItem.nameEn ?? ""}
                  onChange={e => updateItem(activeItemIdx, { nameEn: e.target.value })} />
              </div>
              <div className="note-field">
                <label className="note-label">颜色</label>
                <div className="cb-palette">
                  {PALETTE.map((p, pi) => (
                    <button key={pi} type="button"
                      className={`cb-palette-swatch ${activeItem.color === p.color ? "active" : ""}`}
                      style={{ background: p.color }}
                      onClick={() => updateItem(activeItemIdx, { color: p.color, accent: p.accent })} />
                  ))}
                </div>
              </div>
              {rows.filter(r => r.key && r.label).length > 0 && (
                <div className="note-field">
                  <label className="note-label">对比维度值</label>
                  <div className="cb-tags-grid">
                    {rows.filter(r => r.key && r.label).map(row => (
                      <div key={row.key} className="cb-tag-row">
                        <span className="cb-tag-label">{row.label}</span>
                        <input className="note-input" placeholder="填写该项的值"
                          value={activeItem.tags[row.key] ?? ""}
                          onChange={e => updateTag(activeItemIdx, row.key, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="note-field">
                <label className="note-label">流程步骤（每行一步）</label>
                <textarea className="note-textarea cb-textarea" rows={4}
                  placeholder={"输入特征\n线性变换\n预测结果"}
                  value={(activeItem.flow ?? []).join("\n")}
                  onChange={e => updateItem(activeItemIdx, { flow: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} />
              </div>
              <div className="note-field">
                <label className="note-label">要点列表（每行一条）</label>
                <textarea className="note-textarea cb-textarea" rows={5}
                  placeholder={"最小二乘法\nPython: sklearn\n大模型关联"}
                  value={(activeItem.keyPoints ?? []).join("\n")}
                  onChange={e => updateItem(activeItemIdx, { keyPoints: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} />
              </div>
            </div>
          )}

        </div>

        <div className="note-modal-footer">
          <span className="note-hint">{isNew ? t.addToModule(moduleId) : t.editTakesEffect}</span>
          <button type="button" className="note-save-btn note-save-btn-active" onClick={handleSave}>
            <Save size={13} /> {isNew ? t.createCompare : t.saveChanges}
          </button>
        </div>

      </div>
    </div>
  );
}
