"use client";
import { useState, useRef } from "react";
import { X, Save, Trash2, Plus, PenLine, ImagePlus, Loader } from "lucide-react";
import type { KnowledgeNode, KnowledgeLevel } from "@/data/types";
import { KNOWLEDGE_LEVELS, KNOWLEDGE_LEVEL_DEFAULT } from "@/data/types";
import { ColorPicker, THEME_PRESETS } from "@/components/shared/ColorPicker";
import { uploadImageToGitHub, getImagePreviewUrl } from "@/lib/githubUpload";
import { useI18n } from "@/lib/i18n";
import { useFocusOnMount, genId } from "@/lib/hooks";

interface NodeEditorModalProps {
  node: KnowledgeNode | null;
  moduleId: string;
  tabKey?: string;
  onSave: (node: KnowledgeNode) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function NodeEditorModal({ node, moduleId, tabKey, onSave, onDelete, onClose }: NodeEditorModalProps) {
  const { t } = useI18n();
  const isNew = node === null;
  const [title, setTitle] = useState(node?.title ?? "");
  const [summary, setSummary] = useState(node?.summary ?? "");
  const [level, setLevel] = useState<KnowledgeLevel>(node?.level ?? KNOWLEDGE_LEVEL_DEFAULT);
  const [metaphor, setMetaphor] = useState(node?.metaphor ?? "");
  const [points, setPoints] = useState<string[]>(node?.points ?? [""]);
  const [color, setColor] = useState(node?.color ?? THEME_PRESETS[0].color);
  const [imageUrl, setImageUrl] = useState(node?.imageUrl ?? "");
  const [imagePreview, setImagePreview] = useState(node?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const titleRef = useFocusOnMount<HTMLInputElement>();
  const fileRef = useRef<HTMLInputElement>(null);

  const updatePoint = (i: number, v: string) => setPoints(ps => ps.map((p, j) => j === i ? v : p));
  const addPoint = () => setPoints(ps => [...ps, ""]);
  const removePoint = (i: number) => setPoints(ps => ps.filter((_, j) => j !== i));

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 本地预览
    const previewUrl = getImagePreviewUrl(file);
    setImagePreview(previewUrl);
    setUploadMsg(t.nodeImageUploading);
    setUploading(true);

    const result = await uploadImageToGitHub(file, tabKey ? `${moduleId}/${tabKey}` : moduleId || "misc");
    setUploading(false);

    if (result.ok) {
      setImageUrl(result.url);
      setUploadMsg("✓ " + result.message);
    } else {
      setUploadMsg("✗ " + result.message);
      setImagePreview(imageUrl); // 恢复旧预览
    }
    const timer = setTimeout(() => setUploadMsg(""), 4000);
    return () => clearTimeout(timer);
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImagePreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = () => {
    if (!title.trim()) { titleRef.current?.focus(); return; }
    const saved: KnowledgeNode = {
      id: node?.id ?? genId("node"),
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
      imageUrl: imageUrl || undefined,
    };
    onSave(saved);
    onClose();
  };

  const handleDelete = () => {
    if (!confirm(t.deleteCardConfirm(node?.title ?? ""))) return;
    onDelete?.();
    onClose();
  };

  return (
    <div className="note-overlay" onClick={onClose}>
      <div className="note-modal note-modal-wide" onClick={e => e.stopPropagation()}>

        <div className="note-modal-header">
          <span><PenLine size={14} /> {isNew ? t.addKnowledgeCard : t.editKnowledgeCard(node.title)}</span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {!isNew && onDelete && (
              <button type="button" className="note-delete-btn" onClick={handleDelete}>
                <Trash2 size={13} /> {t.deleteCard}
              </button>
            )}
            <button type="button" className="note-close" onClick={onClose}><X size={14} /></button>
          </div>
        </div>

        <div className="note-edit-body">
          {/* Title */}
          <div className="note-field">
            <label className="note-label">{t.nodeTitle} <span style={{color:"#f06060"}}>*</span></label>
            <input ref={titleRef} className="note-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={t.nodeTitlePlaceholder} />
          </div>

          {/* Summary */}
          <div className="note-field">
            <label className="note-label">{t.nodeSummary}</label>
            <textarea className="note-textarea" value={summary} onChange={e => setSummary(e.target.value)} rows={2} placeholder={t.nodeSummaryPlaceholder} />
          </div>

          {/* Level + Metaphor */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
            <div className="note-field">
              <label className="note-label">{t.nodeDifficulty}</label>
              <div className="node-level-btns">
                {KNOWLEDGE_LEVELS.map(l => (
                  <button key={l} type="button"
                    className={`node-level-btn ${level === l ? "active" : ""}`}
                    onClick={() => setLevel(l)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="note-field">
              <label className="note-label">{t.nodeMetaphor}</label>
              <input className="note-input" value={metaphor} onChange={e => setMetaphor(e.target.value)} placeholder={t.nodeMetaphorPlaceholder} />
            </div>
          </div>

          {/* Color */}
          <div className="note-field">
            <ColorPicker
              label={t.nodeColor}
              value={color}
              onChange={(c) => setColor(c)}
            />
          </div>

          {/* Image Upload */}
          <div className="note-field">
            <div className="note-label-row">
              <label className="note-label">{t.nodeImage}</label>
              {imagePreview && (
                <button type="button" className="note-remove-point" onClick={handleRemoveImage}>
                  <X size={11} /> {t.deleteNode}
                </button>
              )}
            </div>
            {imagePreview ? (
              <div className="node-img-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="preview" />
                {uploading && <div className="node-img-uploading"><Loader size={18} className="note-spin" /></div>}
              </div>
            ) : (
              <button type="button" className="node-img-upload-btn" onClick={() => fileRef.current?.click()}>
                <ImagePlus size={16} />
                <span>{t.nodeImageUpload}</span>
                <span style={{fontSize:"0.65rem",color:"#3a5070"}}>JPG / PNG / GIF / WebP</span>
              </button>
            )}
            {uploadMsg && <p style={{fontSize:"0.7rem",marginTop:"0.25rem",color: uploadMsg.startsWith("✓") ? "var(--c-neon)" : "#f06060"}}>{uploadMsg}</p>}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageSelect}
            />
          </div>

          {/* Points */}
          <div className="note-field">
            <div className="note-label-row">
              <label className="note-label">{t.addKnowledge}</label>
              <button type="button" className="note-add-point" onClick={addPoint}><Plus size={12} /> {t.addKnowledgeBtn}</button>
            </div>
            <ul className="note-points-list">
              {points.map((pt, i) => (
                <li key={i} className="note-point-item">
                  <input className="note-input" value={pt} onChange={e => updatePoint(i, e.target.value)} placeholder={`${t.addKnowledge} ${i + 1}`} />
                  <button type="button" className="note-remove-point" onClick={() => removePoint(i)}><X size={11} /></button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="note-modal-footer">
          <span className="note-hint">{t.nodeSaveHint}</span>
          <button type="button" className="note-save-btn note-save-btn-active" onClick={handleSave} disabled={uploading}>
            <Save size={13} /> {isNew ? t.createCard : t.saveChanges}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Add Node Button ──
export function AddNodeButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" className="add-node-btn" onClick={onClick}>
      <Plus size={14} /> {t.addKnowledgeBtn}
    </button>
  );
}
