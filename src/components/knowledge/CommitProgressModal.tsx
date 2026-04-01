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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/55 backdrop-blur-[3px]">
      <div className="bg-[#0d1a2e] border border-[rgba(80,140,220,0.3)] rounded-xl p-6 min-w-[340px] max-w-[480px] w-[90vw] shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base text-[#a0c4f0] font-semibold">
            {done
              ? hasError ? "⚠ 部分提交失败" : "☁ 提交完成"
              : "☁ 正在提交到 GitHub…"}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${done ? 100 : progress}%`,
                background: hasError ? "linear-gradient(90deg, #f08080, #d04040)" : "linear-gradient(90deg, #3a8fd8, #50d0a0)"
              }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[#4a6888]">{completedCount}/{total} 项</span>
            <span className="text-xs text-[#4a6888]">{done ? 100 : progress}%</span>
          </div>
        </div>

        {/* Task list */}
        <div className="flex flex-col gap-3">
          {tasks.map(task => (
            <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border transition-colors"
              style={{
                borderColor: task.status === "error" ? "rgba(240,128,128,0.2)" : task.status === "done" ? "rgba(80,208,160,0.15)" : "rgba(60,90,140,0.2)"
              }}>
              <span className={`text-sm shrink-0 mt-0.5 ${task.status === "running" ? "animate-spin" : ""}`}
                style={{ color: STATUS_COLOR[task.status] }}>
                {STATUS_ICON[task.status]}
              </span>
              <div>
                <div className="text-sm" style={{ color: task.status === "pending" ? "#5a7898" : "#a0c4f0", fontWeight: 500 }}>
                  {task.label}
                </div>
                {task.message && (
                  <div className="text-xs mt-1" style={{ color: task.status === "error" ? "#f08080" : "#50d0a0" }}>
                    {task.message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {done && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded-md border cursor-pointer transition-colors"
              style={{
                borderColor: "rgba(80,140,220,0.3)",
                background: hasError ? "rgba(180,40,40,0.15)" : "rgba(40,100,180,0.2)",
                color: hasError ? "#f08080" : "#7ab8f0"
              }}>
              关闭
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
