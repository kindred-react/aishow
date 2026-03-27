"use client";
import { useState, useEffect, useRef } from "react";
import { PenLine, X, Save, Cloud, CloudOff, Loader } from "lucide-react";
import { saveNotesToGitHub } from "@/lib/githubNotes";

const LS_KEY = "aishow_user_notes";

function loadNotes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveNotesLocal(notes: Record<string, string>) {
  localStorage.setItem(LS_KEY, JSON.stringify(notes));
}

// ── Single note button shown on each card ──
interface NoteButtonProps {
  nodeId: string;
}

export function NoteButton({ nodeId }: NoteButtonProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [saving, setSaving] = useState<"idle" | "local" | "github" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasToken = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_GITHUB_TOKEN;

  // Load from localStorage on mount
  useEffect(() => {
    const n = loadNotes();
    setNotes(n);
    setText(n[nodeId] ?? "");
  }, [nodeId]);

  // Focus textarea when opened
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [open]);

  const handleSave = async () => {
    // 1. Save locally immediately
    setSaving("local");
    const updated = { ...notes, [nodeId]: text };
    if (!text.trim()) delete updated[nodeId];
    setNotes(updated);
    saveNotesLocal(updated);

    // 2. Try GitHub
    setSaving("github");
    const result = await saveNotesToGitHub(updated);
    if (result.ok) {
      setSaving("done");
      setMsg(result.message);
    } else {
      setSaving("error");
      setMsg(result.message);
    }
    setTimeout(() => { setSaving("idle"); setMsg(""); }, 3000);
  };

  const hasNote = !!notes[nodeId]?.trim();

  return (
    <>
      <button
        type="button"
        className={`note-btn ${hasNote ? "note-btn-has" : ""}`}
        title={hasNote ? "查看/编辑笔记" : "添加笔记"}
        onClick={() => setOpen(true)}
      >
        <PenLine size={12} />
        {hasNote && <span className="note-dot" />}
      </button>

      {open && (
        <div className="note-overlay" onClick={() => setOpen(false)}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <span><PenLine size={14} /> 我的笔记</span>
              <button type="button" className="note-close" onClick={() => setOpen(false)}><X size={14} /></button>
            </div>
            <textarea
              ref={textareaRef}
              className="note-textarea"
              placeholder="在这里写下你的笔记、理解或问题…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
            />
            <div className="note-modal-footer">
              <div className="note-status">
                {saving === "local" && <span><Loader size={12} className="note-spin" /> 保存中…</span>}
                {saving === "github" && <span><Loader size={12} className="note-spin" /> 同步到 GitHub…</span>}
                {saving === "done" && <span className="note-ok"><Cloud size={12} /> {msg}</span>}
                {saving === "error" && <span className="note-err"><CloudOff size={12} /> {msg}</span>}
                {saving === "idle" && !hasToken && <span className="note-warn"><CloudOff size={12} /> 仅本地保存（未配置 GitHub Token）</span>}
              </div>
              <button type="button" className="note-save-btn" onClick={handleSave} disabled={saving === "local" || saving === "github"}>
                <Save size={13} /> 保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Display saved note inline on card ──
export function NoteDisplay({ nodeId }: { nodeId: string }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    const n = loadNotes();
    setNote(n[nodeId] ?? "");
    // Listen for storage changes (other tabs)
    const handler = () => setNote(loadNotes()[nodeId] ?? "");
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [nodeId]);

  if (!note) return null;
  return (
    <div className="note-display">
      <span className="note-display-label"><PenLine size={11} /> 我的笔记</span>
      <p>{note}</p>
    </div>
  );
}
