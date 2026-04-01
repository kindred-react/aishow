"use client";
import { createPortal } from "react-dom";

// ── CommitTask type ───────────────────────────────────────────────────────
export type CommitTask = {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  message?: string;
};

interface CommitProgressModalProps {
  tasks: CommitTask[];
  syncStatus: "idle" | "syncing" | "done" | "error";
  onClose: () => void;
}

const STATUS_ICON: Record<CommitTask["status"], string> = {
  pending: "○",
  running: "⟳",
  done:    "✓",
  error:   "✗",
};

const STATUS_COLOR: Record<CommitTask["status"], string> = {
  pending: "#4a6888",
  running: "#7ab8f0",
  done:    "#50d0a0",
  error:   "#f08080",
};

export function CommitProgressModal({ tasks, syncStatus, onClose }: CommitProgressModalProps) {
  if (tasks.length === 0) return null;
  if (typeof document === "undefined") return null;

  const done = syncStatus === "done" || syncStatus === "error";
  const total = tasks.length;
  const completedCount = tasks.filter(t => t.status === "done" || t.status === "error").length;
  const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100);
  const hasError = tasks.some(t => t.status === "error");

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
    }}>
      <div style={{
        background: "#0d1a2e",
        border: "1px solid rgba(80,140,220,0.3)",
        borderRadius: "12px",
        padding: "1.6rem 1.8rem",
        minWidth: "340px",
        maxWidth: "480px",
        width: "90vw",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.2rem" }}>
          <span style={{ fontSize: "1rem", color: "#a0c4f0", fontWeight: 600 }}>
            {done
              ? hasError ? "⚠ 部分提交失败" : "☁ 提交完成"
              : "☁ 正在提交到 GitHub…"}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: "1.2rem" }}>
          <div style={{
            height: "6px", borderRadius: "3px",
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${done ? 100 : progress}%`,
              background: hasError
                ? "linear-gradient(90deg, #f08080, #d04040)"
                : "linear-gradient(90deg, #3a8fd8, #50d0a0)",
              borderRadius: "3px",
              transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem" }}>
            <span style={{ fontSize: "0.72rem", color: "#4a6888" }}>{completedCount}/{total} 项</span>
            <span style={{ fontSize: "0.72rem", color: "#4a6888" }}>{done ? 100 : progress}%</span>
          </div>
        </div>

        {/* Task list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              display: "flex", alignItems: "flex-start", gap: "0.55rem",
              padding: "0.5rem 0.7rem",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${task.status === "error" ? "rgba(240,128,128,0.2)" : task.status === "done" ? "rgba(80,208,160,0.15)" : "rgba(60,90,140,0.2)"}`,
              borderRadius: "7px",
              transition: "border-color 0.2s",
            }}>
              <span style={{
                fontSize: "0.9rem",
                color: STATUS_COLOR[task.status],
                flexShrink: 0,
                marginTop: "0.05rem",
                animation: task.status === "running" ? "spin 1s linear infinite" : "none",
              }}>
                {STATUS_ICON[task.status]}
              </span>
              <div>
                <div style={{ fontSize: "0.82rem", color: task.status === "pending" ? "#5a7898" : "#a0c4f0", fontWeight: 500 }}>
                  {task.label}
                </div>
                {task.message && (
                  <div style={{ fontSize: "0.72rem", color: task.status === "error" ? "#f08080" : "#50d0a0", marginTop: "0.2rem" }}>
                    {task.message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {done && (
          <div style={{ marginTop: "1.2rem", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.35rem 1rem",
                fontSize: "0.8rem",
                borderRadius: "6px",
                border: "1px solid rgba(80,140,220,0.3)",
                background: hasError ? "rgba(180,40,40,0.15)" : "rgba(40,100,180,0.2)",
                color: hasError ? "#f08080" : "#7ab8f0",
                cursor: "pointer",
              }}
            >
              关闭
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
}
