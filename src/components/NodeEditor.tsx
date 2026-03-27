"use client";
import { useState, useEffect, useRef } from "react";
import { X, Save, Trash2, Plus, PenLine } from "lucide-react";
import type { KnowledgeNode, KnowledgeLevel } from "@/data/types";

const LEVELS: KnowledgeLevel[] = ["基础", "进阶", "实战"];
const COLORS = [
  "var(--c-neon)", "var(--c-violet)", "var(--c-pink)",
  "var(--c-cyan)", "#f0a030", "#60d890", "#a080f0", "#f06060",
];

function genId() {
  return "node-" + Math.random().toString(36).slice(2, 8);
}

interface NodeEditorModalProps {
  /** null = 新增模式，传入节点 = 编辑模式 */
  node: KnowledgeNode | null;
  moduleId: string;
  onSave: (node: KnowledgeNode) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function NodeEditorModal({ node, moduleId, onSave, onDelete, onClose }: NodeEditorModalProps) {
  const isNew = node === null;
  const [title, setTitle] = useState(node?.title ?? "");
  const [summary, setSummary] = useState(node?.summary ?? "");
  const [level, setLevel] = useState<KnowledgeLevel>(node?.level ?? "基础");
  const [metaphor, setMetaphor] = useState(node?.metaphor ?? "");
  const [points, setPoints] = useState<string[]>(node?.points ?? [""]);
  const [color, setColor] = useState(node?.color ?? COLORS[0]);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 60);
  }, []);

  const updatePoint = (i: number, v: string) => setPoints(ps => ps.map((p, j) => j === i ? v : p));
  const addPoint = () => setPoints(ps => [...ps, ""]);
  const removePoint = (i: number) => setPoints(ps => ps.filter((_, j) => j !== i));

  const handleSave = () => {
    if (!title.trim()) { titleRef.current?.focus(); return; }
    const saved: KnowledgeNode = {
      id: node?.id ?? genId(),
      title: title.trim(),
      summary: summary.trim(),
      level,
      metaphor: metaphor.trim(),
      points: points.filter(p => p.trim()),
      color,
      relatedOps: node?.relatedOps ?? [],
      source: node?.source,
      updatedAt: new Date().toISOString().slice(0, 10),
      version: (node?.version ?? 0) + 1,
      imageUrl: node?.imageUrl,
    };
    onSave(saved);
    onClose();
  };

  const handleDelete = () => {
    if (!confirm(`确定删除「${node?.title}」卡片？此操作不可直接撤销。`)) return;
    onDelete?.();
    onClose();
  };

  return (
    <div className="note-overlay" onClick={onClose}>
      <div className="note-modal note-modal-wide" onClick={e => e.stopPropagation()}>

        <div className="note-modal-header">
          <span><PenLine size={14} /> {isNew ? "新增知识点卡片" : `编辑：${node.title}`}</span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {!isNew && onDelete && (
              <button type="button" className="note-delete-btn" onClick={handleDelete}>
                <Trash2 size={13} /> 删除卡片
              </button>
            )}
            <button type="button" className="note-close" onClick={onClose}><X size={14} /></button>
          </div>
        </div>

        <div className="note-edit-body">
          {/* Title */}
          <div className="note-field">
            <label className="note-label">标题 <span style={{color:"#f06060"}}>*</span></label>
            <input ref={titleRef} className="note-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="知识点标题" />
          </div>

          {/* Summary */}
          <div className="note-field">
            <label className="note-label">摘要</label>
            <textarea className="note-textarea" value={summary} onChange={e => setSummary(e.target.value)} rows={2} placeholder="一句话解释这个概念" />
          </div>

          {/* Level + Metaphor */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
            <div className="note-field">
              <label className="note-label">难度级别</label>
              <div className="node-level-btns">
                {LEVELS.map(l => (
                  <button key={l} type="button"
                    className={`node-level-btn ${level === l ? "active" : ""}`}
                    onClick={() => setLevel(l)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="note-field">
              <label className="note-label">类比/比喻</label>
              <input className="note-input" value={metaphor} onChange={e => setMetaphor(e.target.value)} placeholder="如：像GPS导航" />
            </div>
          </div>

          {/* Color */}
          <div className="note-field">
            <label className="note-label">卡片颜色</label>
            <div className="node-color-picker">
              {COLORS.map(c => (
                <button key={c} type="button"
                  className={`node-color-swatch ${color === c ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Points */}
          <div className="note-field">
            <div className="note-label-row">
              <label className="note-label">知识要点</label>
              <button type="button" className="note-add-point" onClick={addPoint}><Plus size={12} /> 添加要点</button>
            </div>
            <ul className="note-points-list">
              {points.map((pt, i) => (
                <li key={i} className="note-point-item">
                  <input className="note-input" value={pt} onChange={e => updatePoint(i, e.target.value)} placeholder={`要点 ${i + 1}`} />
                  <button type="button" className="note-remove-point" onClick={() => removePoint(i)}><X size={11} /></button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="note-modal-footer">
          <span className="note-hint">保存后立即生效，同时同步到 GitHub 仓库</span>
          <button type="button" className="note-save-btn note-save-btn-active" onClick={handleSave}>
            <Save size={13} /> {isNew ? "创建卡片" : "保存修改"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Add Node Button ──
export function AddNodeButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="add-node-btn" onClick={onClick}>
      <Plus size={14} /> 新增知识点
    </button>
  );
}
