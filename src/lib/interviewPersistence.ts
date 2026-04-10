/**
 * Interview knowledge base — localStorage persistence with validation,
 * versioning, quota handling, and safe defaults.
 */
import { LS_INTERVIEW_STATE_KEY } from "@/data/constants";

export const INTERVIEW_STATE_VERSION = 1;

export interface InterviewPersistedState {
  version: number;
  /** Category labels that are collapsed in the left sidebar */
  collapsedCategories: string[];
  /** Current document slug (path under public/md, without .md) */
  selectedSlug: string | null;
  /** Main content scroll position */
  scrollTop: number;
  /** Last active heading id (TOC / in-view section) */
  activeHeadingId: string;
  updatedAt: number;
}

const DEFAULT_STATE: InterviewPersistedState = {
  version: INTERVIEW_STATE_VERSION,
  collapsedCategories: [],
  selectedSlug: null,
  scrollTop: 0,
  activeHeadingId: "",
  updatedAt: 0,
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/** Parse and validate persisted JSON; returns defaults on any failure. */
export function parseInterviewState(raw: string | null): InterviewPersistedState {
  if (raw == null || raw === "") return { ...DEFAULT_STATE };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...DEFAULT_STATE };

    const version = typeof parsed.version === "number" ? parsed.version : 0;
    if (version !== INTERVIEW_STATE_VERSION) {
      // Future: migrate older versions here
      return { ...DEFAULT_STATE };
    }

    const collapsedCategories = isStringArray(parsed.collapsedCategories)
      ? parsed.collapsedCategories
      : [];

    const selectedSlug =
      parsed.selectedSlug === null
        ? null
        : typeof parsed.selectedSlug === "string"
          ? parsed.selectedSlug
          : null;

    const scrollTop =
      typeof parsed.scrollTop === "number" && Number.isFinite(parsed.scrollTop) && parsed.scrollTop >= 0
        ? Math.min(parsed.scrollTop, 1e7)
        : 0;

    const activeHeadingId =
      typeof parsed.activeHeadingId === "string" ? parsed.activeHeadingId : "";

    const updatedAt =
      typeof parsed.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
        ? parsed.updatedAt
        : Date.now();

    return {
      version: INTERVIEW_STATE_VERSION,
      collapsedCategories,
      selectedSlug,
      scrollTop,
      activeHeadingId,
      updatedAt,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function trySetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    const name = e instanceof DOMException ? e.name : "";
    if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
      try {
        const minimal: InterviewPersistedState = {
          ...DEFAULT_STATE,
          selectedSlug: (() => {
            try {
              const p = JSON.parse(value) as { selectedSlug?: unknown };
              return typeof p.selectedSlug === "string" ? p.selectedSlug : null;
            } catch {
              return null;
            }
          })(),
          updatedAt: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(minimal));
        return true;
      } catch {
        try {
          sessionStorage.setItem(key, value);
          return true;
        } catch {
          return false;
        }
      }
    }
    return false;
  }
}

function readPersistedRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LS_INTERVIEW_STATE_KEY) ?? sessionStorage.getItem(LS_INTERVIEW_STATE_KEY);
  } catch {
    return null;
  }
}

export function loadInterviewState(): InterviewPersistedState {
  return parseInterviewState(readPersistedRaw());
}

export function saveInterviewState(partial: Partial<InterviewPersistedState>): boolean {
  if (typeof window === "undefined") return false;
  const prev = parseInterviewState(readPersistedRaw());
  const next: InterviewPersistedState = {
    ...prev,
    ...partial,
    version: INTERVIEW_STATE_VERSION,
    updatedAt: Date.now(),
  };
  const json = JSON.stringify(next);
  const ok = trySetItem(LS_INTERVIEW_STATE_KEY, json);
  if (!ok) {
    try {
      sessionStorage.setItem(LS_INTERVIEW_STATE_KEY, json);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

export function clearInterviewState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_INTERVIEW_STATE_KEY);
    sessionStorage.removeItem(LS_INTERVIEW_STATE_KEY);
  } catch {
    /* ignore */
  }
}
