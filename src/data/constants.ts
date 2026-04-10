/**
 * constants.ts
 * Centralised application constants — single source of truth.
 * Import from here instead of defining inline in components.
 */

// ── localStorage keys ───────────────────────────────────────────────────
export const LS_CONTENT_STORE_KEY = "aishow_content_store";
export const LS_KB_THEME_KEY      = "kb-theme";
export const LS_KB_MODULE_KEY     = "kb-module";
export const LS_KB_DIMENSION_KEY  = "kb-dimension";
export const LS_KB_LEVEL_KEY      = "kb-level";
export const LS_KB_LOCALE_KEY     = "kb-locale";

/** Interview knowledge base (markdown docs) — scroll, TOC, menu, selected doc */
export const LS_INTERVIEW_STATE_KEY = "aishow_interview_kb_v1";

// ── GitHub ────────────────────────────────────────────────────────────────
export const GITHUB_REPO   = "kindred-react/aishow";
export const GITHUB_BRANCH = "main";

/** Base directory for uploaded images in the repo. */
export const UPLOAD_BASE_DIR = "public/uploads";

// ── Edit Mode ─────────────────────────────────────────────────────────────
/** sessionStorage key for persisting edit mode across page reloads. */
export const SESSION_EDIT_KEY = "aishow_edit_mode";

/**
 * Edit mode password.
 * TODO: Replace with NEXT_PUBLIC_EDIT_PASSWORD env var for production.
 */
export const EDIT_PASSWORD = process.env.NEXT_PUBLIC_EDIT_PASSWORD ?? "1";

// ── UI ────────────────────────────────────────────────────────────────────
/** Filter sentinel value meaning "show all" — used in knowledge level filter. */
export const FILTER_ALL = "all" as const;
export type FilterAll = typeof FILTER_ALL;

/** Emoji icon picker options for module editor. */
export const MODULE_ICONS: string[] = [
  "📚","🔍","⚙️","🚀","🤖","🧠","💡","🎯",
  "📊","🛠️","🌐","💼","🔬","📝","🎨","⚡",
];
