"use client";
import { useState, useEffect } from "react";
import { PenLine, Trash2, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { KnowledgeNode, OperationStep } from "@/data/types";
import { LS_CONTENT_STORE_KEY } from "@/data/constants";

// ── Read nodeEdits from unified content store ──

function loadNodeEdits(): Record<string, Partial<KnowledgeNode>> {
  if (typeof window === "undefined") return {};
  try {
    const store = JSON.parse(localStorage.getItem(LS_CONTENT_STORE_KEY) ?? "{}");
    return store.nodeEdits ?? {};
  } catch { return {}; }
}

// ────────────────────────────────────────────
// Hook: get merged node (original + user edit)
// reads from the unified content store
// ────────────────────────────────────────────
export function useMergedNode(node: KnowledgeNode): KnowledgeNode {
  const [edit, setEdit] = useState<Partial<KnowledgeNode> | null>(null);

  useEffect(() => {
    const refresh = () => setEdit(loadNodeEdits()[node.id] ?? null);
    refresh();
    const handler = (e: Event) => {
      const store = (e as CustomEvent).detail as { nodeEdits?: Record<string, Partial<KnowledgeNode>> };
      setEdit(store.nodeEdits?.[node.id] ?? null);
    };
    window.addEventListener("content-store-updated", handler);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("content-store-updated", handler);
      window.removeEventListener("storage", refresh);
    };
  }, [node.id]);

  if (!edit) return node;
  return { ...node, ...edit };
}

// ────────────────────────────────────────────
// KnowledgeCard — wraps a single card with edit support
// ────────────────────────────────────────────
export function KnowledgeCard({
  rawNode,
  operationSteps,
  onJumpToOp,
  onEdit,
  onDelete,
}: {
  rawNode: KnowledgeNode;
  operationSteps: OperationStep[];
  onJumpToOp: (id: string) => void;
  onEdit?: (node: KnowledgeNode) => void;
  onDelete?: (nodeId: string) => void;
}) {
  const { t } = useI18n();
  const node = useMergedNode(rawNode);
  return (
    <article id={`item-${node.id}`} className="concept-card">
      <div className="card-top" style={{ borderColor: node.color }}>
        <strong>{node.title}</strong>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
          <span>{node.level} · {node.metaphor}</span>
          {onEdit && (
            <button type="button" className="note-btn" title={t.editCard} onClick={() => onEdit(node)}>
              <PenLine size={12} />
            </button>
          )}
          {onDelete && (
            <button type="button" className="note-btn note-btn-danger" title={t.deleteCard2}
              onClick={() => {
                if (confirm(t.deleteCardConfirm2(node.title))) onDelete(rawNode.id);
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
      <p>{node.summary}</p>
      <ul>{node.points.map((point: string) => <li key={point}>{point}</li>)}</ul>
      {node.imageUrl && (
        <div className="knowledge-img"><img src={node.imageUrl} alt={node.title} loading="lazy" /></div>
      )}
      {(node.source || node.updatedAt) && (
        <div className="knowledge-meta">
          {node.source && <span className="meta-source">{t.sourceLabel}{node.source}</span>}
          {node.updatedAt && <span className="meta-date">{node.updatedAt}</span>}
          {node.version && node.version > 1 && <span className="meta-version">v{node.version}</span>}
        </div>
      )}
      {rawNode.relatedOps && rawNode.relatedOps.length > 0 && (
        <div className="related-ops">
          {rawNode.relatedOps.map((opId: string) => {
            const op = operationSteps.find((s) => s.id === opId);
            if (!op) return null;
            return (
              <button key={opId} type="button" className="related-op-btn" onClick={() => onJumpToOp(opId)}>
                <ArrowRight size={11} /> {op.title}
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}
