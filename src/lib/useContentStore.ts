/**
 * useContentStore — 管理用户对知识库的本地编辑
 * 保存时直接通过 GitHub API 写回对应的 .ts 模块文件
 *
 * Tab-specific items are stored in three generic maps keyed by tabKey:
 *   tabItems[tabKey][moduleId]  = T[]           (added items)
 *   tabEdits[tabKey][itemId]    = Partial<T>     (edits, includes __mid)
 *   tabDeleted[tabKey]          = string[]       (deleted item ids)
 *
 * To add a new tab type: add one entry to WIDGET_MODULE_MAP (types.ts)
 * and one entry to TAB_FIELD_MAP below. No other changes needed.
 */
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { KnowledgeNode, LearningModule, CompareBlock } from "@/data/types";
import { learningModules } from "@/data/knowledge";
import { compareBlocks as staticCompareBlocks } from "@/data/compareBlocks";
import { pushAllChangesAsOneCommit, buildModuleEntries, buildCompareEntry, buildIndexEntry } from "@/lib/githubNotes";

// ── Commit progress task type ──────────────────────────────────────────────
export type CommitTask = {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  message?: string;
};

import { WIDGET_MODULE_MAP } from "@/data/types";

const LS_KEY = "aishow_content_store";

type ModuleList<T> = Record<string, T[]>;
type ItemRecord = Record<string, unknown>;

// ── TAB_FIELD_MAP ──────────────────────────────────────────────────────────
// Derived from WIDGET_MODULE_MAP — maps each defaultTab key → LearningModule field.
// No manual maintenance needed: add a new entry to WIDGET_MODULE_MAP in types.ts.
export const TAB_FIELD_MAP: Record<string, keyof LearningModule> =
  Object.fromEntries(
    WIDGET_MODULE_MAP
      .filter(e => e.defaultTab !== "knowledge") // knowledge handled separately
      .map(e => [e.defaultTab, e.field])
  );

export const ALL_TAB_KEYS = Object.keys(TAB_FIELD_MAP);

export interface ContentStore {
  // ── Knowledge nodes ──
  nodeEdits:    Record<string, Partial<KnowledgeNode> & { __mid?: string }>;
  addedNodes:   ModuleList<KnowledgeNode>;
  deletedNodes: string[];
  // ── Modules ──
  addedModules:  LearningModule[];
  deletedModules: string[];
  moduleEdits:   Record<string, Partial<Pick<LearningModule, "name" | "icon" | "intro" | "enabledTabs">>>;
  // ── Compare blocks ──
  compareBlocks: CompareBlock[];
  // ── Tab-specific items (generic, keyed by tabKey) ──
  tabItems:   Record<string, ModuleList<ItemRecord>>;           // tabKey → moduleId → items[]
  tabEdits:   Record<string, Record<string, ItemRecord>>;       // tabKey → itemId → partial + __mid
  tabDeleted: Record<string, string[]>;                         // tabKey → deleted ids
}

const mkTabDefaults = (val: () => unknown) =>
  Object.fromEntries(ALL_TAB_KEYS.map(k => [k, val()]));

const DEFAULT_STORE: ContentStore = {
  nodeEdits: {}, addedNodes: {}, deletedNodes: [],
  addedModules: [], deletedModules: [], moduleEdits: {},
  compareBlocks: staticCompareBlocks,
  tabItems:   mkTabDefaults(() => ({}))  as Record<string, ModuleList<ItemRecord>>,
  tabEdits:   mkTabDefaults(() => ({}))  as Record<string, Record<string, ItemRecord>>,
  tabDeleted: mkTabDefaults(() => ([]))  as Record<string, string[]>,
};

// ── localStorage ─────────────────────────────────────────────────────────
function loadLocal(): ContentStore {
  if (typeof window === "undefined") return DEFAULT_STORE;
  try {
    const persisted = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Partial<ContentStore>;
    const localBlocks: CompareBlock[] = persisted.compareBlocks ?? [];
    const staticIds = new Set(staticCompareBlocks.map(b => b.id));
    const localOnly = localBlocks.filter(b => !staticIds.has(b.id));
    const merged = [
      ...staticCompareBlocks.map(b => localBlocks.find(l => l.id === b.id) ?? b),
      ...localOnly,
    ];
    return { ...DEFAULT_STORE, ...persisted, compareBlocks: merged };
  } catch { return DEFAULT_STORE; }
}

function saveLocal(store: ContentStore) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("content-store-updated", { detail: store }));
  }, 0);
}

function mergeList<T extends { id: string }>(
  base: T[], added: T[],
  edited: Record<string, Partial<T>>,
  deleted: string[]
): T[] {
  const merged = base
    .filter(i => !deleted.includes(i.id))
    .map(i => edited[i.id] ? { ...i, ...edited[i.id] } : i);
  const baseIds = new Set(merged.map(i => i.id));
  const extra = added
    .filter(i => !deleted.includes(i.id) && !baseIds.has(i.id))
    .map(i => edited[i.id] ? { ...i, ...edited[i.id] } : i);
  return [...merged, ...extra];
}

function getMergedNodes(moduleId: string, store: ContentStore): KnowledgeNode[] {
  const base = learningModules.find(m => m.id === moduleId);
  return mergeList(
    base?.knowledgeNodes ?? [],
    store.addedNodes[moduleId] ?? [],
    store.nodeEdits as Record<string, Partial<KnowledgeNode>>,
    store.deletedNodes
  );
}

function getMergedModule(m: LearningModule, store: ContentStore): LearningModule {
  const mid = m.id;
  const edit = store.moduleEdits[mid];
  const result: LearningModule = { ...(edit ? { ...m, ...edit } : m) };
  result.knowledgeNodes = getMergedNodes(mid, store);
  for (const [tabKey, field] of Object.entries(TAB_FIELD_MAP)) {
    const base    = ((m[field] ?? []) as { id: string }[]);
    const added   = ((store.tabItems[tabKey]?.[mid]   ?? []) as { id: string }[]);
    const edited  = (store.tabEdits[tabKey]   ?? {}) as Record<string, Partial<{ id: string }>>;
    const deleted = store.tabDeleted[tabKey] ?? [];
    (result as unknown as Record<string, unknown>)[field as string] = mergeList(base, added, edited, deleted);
  }
  return result;
}

export function useContentStore() {
  const [savedStore, setSavedStore] = useState<ContentStore>(DEFAULT_STORE);
  const savedStoreRef = useRef<ContentStore>(DEFAULT_STORE);
  const [draftStore, setDraftStore] = useState<ContentStore | null>(null);
  const store = draftStore ?? savedStore;
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncMsg, setSyncMsg] = useState("");
  const [commitTasks, setCommitTasks] = useState<CommitTask[]>([]);

  useEffect(() => {
    const initial = loadLocal();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedStore(initial);
    savedStoreRef.current = initial;
    const handler = (e: Event) => {
      const s = (e as CustomEvent).detail as ContentStore;
      setSavedStore(s); savedStoreRef.current = s;
    };
    const storageHandler = () => {
      const s = loadLocal();
      setSavedStore(s); savedStoreRef.current = s;
    };
    window.addEventListener("content-store-updated", handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("content-store-updated", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const beginDraft = useCallback(() => {
    const current = loadLocal();
    setSavedStore(current); savedStoreRef.current = current; setDraftStore(current);
  }, []);

  const commitDraft = useCallback((mergedModules: LearningModule[]) => {
    setDraftStore(prev => {
      if (!prev) return null;
      const baselineStore = savedStoreRef.current;
      saveLocal(prev); setSavedStore(prev); savedStoreRef.current = prev;

      const changedIds = new Set<string>([
        ...prev.addedModules.map(m => m.id),
        ...Object.keys(prev.addedNodes),
        ...Object.keys(prev.moduleEdits),
        // nodeEdits: use __mid if stored, else reverse-lookup
        ...Object.entries(prev.nodeEdits).flatMap(([nodeId, e]) =>
          e.__mid ? [e.__mid]
            : mergedModules.filter(m => m.knowledgeNodes.some(n => n.id === nodeId)).map(m => m.id)
        ),
        // tabItems added: keys are moduleIds
        ...ALL_TAB_KEYS.flatMap(k => Object.keys(prev.tabItems[k] ?? {})),
        // tabEdits: __mid stored at edit time
        ...ALL_TAB_KEYS.flatMap(k =>
          Object.values(prev.tabEdits[k] ?? {}).map(e => (e as { __mid?: string }).__mid).filter(Boolean) as string[]
        ),
        // tabDeleted: reverse-lookup via base modules
        ...ALL_TAB_KEYS.flatMap(k => {
          const field = TAB_FIELD_MAP[k];
          return (prev.tabDeleted[k] ?? []).flatMap(id =>
            mergedModules.filter(m =>
              learningModules.find(b => b.id === m.id)?.[field] &&
              ((learningModules.find(b => b.id === m.id)![field] as { id: string }[]) ?? []).some((i: { id: string }) => i.id === id)
            ).map(m => m.id)
          );
        }),
        // deletedNodes: reverse-lookup
        ...prev.deletedNodes.flatMap(id =>
          mergedModules.filter(m =>
            learningModules.find(b => b.id === m.id)?.knowledgeNodes.some(n => n.id === id)
          ).map(m => m.id)
        ),
        ...prev.deletedModules,
      ]);

      const ids = [...changedIds].filter(id => id);
      const hasCompareChanges = JSON.stringify(prev.compareBlocks) !== JSON.stringify(baselineStore.compareBlocks);
      const hasModuleStructureChanges = prev.addedModules.length > 0 || prev.deletedModules.length > 0;
      if (ids.length > 0 || hasCompareChanges || hasModuleStructureChanges) {
        setSyncStatus("syncing"); setSyncMsg("正在推送到 GitHub…");

        // Build all file entries
        const allEntries: { path: string; content: string; label: string }[] = [];
        if (ids.length > 0) allEntries.push(...buildModuleEntries(ids, mergedModules));
        if (hasCompareChanges) allEntries.push(buildCompareEntry(prev.compareBlocks));
        if (hasModuleStructureChanges) allEntries.push(buildIndexEntry(mergedModules));

        // Build task list for progress modal — one task per file
        const tasks: CommitTask[] = allEntries.map(e => ({
          id: e.path,
          label: e.label,
          status: "pending",
        }));
        setCommitTasks(tasks);

        // Mark all as running, then push as single commit
        setCommitTasks(t => t.map(x => ({ ...x, status: "running" })));

        (async () => {
          const moduleNames = ids.map(id => mergedModules.find(m => m.id === id)?.name ?? id);
          const commitMsg = [
            moduleNames.length > 0 ? `feat: update ${moduleNames.join(", ")}` : "",
            hasCompareChanges ? "compareBlocks" : "",
            hasModuleStructureChanges ? "knowledge index" : "",
          ].filter(Boolean).join(" + ") + " [web editor]";

          const result = await pushAllChangesAsOneCommit(allEntries, commitMsg);

          setCommitTasks(t => t.map(x => ({
            ...x,
            status: result.ok ? "done" : "error",
            message: result.ok ? "已写入" : result.message,
          })));
          setSyncStatus(result.ok ? "done" : "error");
          setSyncMsg(result.message);
          setTimeout(() => { setSyncStatus("idle"); setSyncMsg(""); setCommitTasks([]); }, 8000);
        })();
      }
      return null;
    });
  }, []);

  const discardDraft = useCallback(() => setDraftStore(null), []);

  const clearCommit = useCallback(() => {
    setSyncStatus("idle"); setSyncMsg(""); setCommitTasks([]);
  }, []);

  const hasDraftChanges = draftStore !== null && JSON.stringify(draftStore) !== JSON.stringify(savedStore);

  const updateDraft = useCallback((fn: (s: ContentStore) => ContentStore) => {
    setDraftStore(prev => fn(prev ?? savedStore));
  }, [savedStore]);

  // ── Knowledge node operations ──
  const editNode = useCallback((moduleId: string, nodeId: string, fields: Partial<KnowledgeNode>) => {
    updateDraft(s => ({
      ...s,
      nodeEdits: { ...s.nodeEdits, [nodeId]: { ...s.nodeEdits[nodeId], ...fields, __mid: moduleId } },
      addedNodes: Object.fromEntries(
        Object.entries(s.addedNodes).map(([mid, nodes]) => [mid, nodes.filter(n => n.id !== nodeId)])
      ),
    }));
  }, [updateDraft]);

  const addNode = useCallback((moduleId: string, node: KnowledgeNode) => {
    updateDraft(s => ({ ...s, addedNodes: { ...s.addedNodes, [moduleId]: [...(s.addedNodes[moduleId] ?? []), node] } }));
  }, [updateDraft]);

  const deleteNode = useCallback((moduleId: string, nodeId: string) => {
    updateDraft(s => ({
      ...s,
      deletedNodes: [...s.deletedNodes.filter(id => id !== nodeId), nodeId],
      addedNodes: Object.fromEntries(
        Object.entries(s.addedNodes).map(([mid, nodes]) => [mid, nodes.filter(n => n.id !== nodeId)])
      ),
    }));
  }, [updateDraft]);

  const restoreNode = useCallback((moduleId: string, nodeId: string) => {
    updateDraft(s => ({
      ...s,
      deletedNodes: s.deletedNodes.filter(id => id !== nodeId),
      nodeEdits: Object.fromEntries(Object.entries(s.nodeEdits).filter(([id]) => id !== nodeId)),
    }));
  }, [updateDraft]);

  // ── Compare block operations ──
  const addCompareBlock    = useCallback((block: CompareBlock) =>
    updateDraft(s => ({ ...s, compareBlocks: [...s.compareBlocks, block] })), [updateDraft]);
  const editCompareBlock   = useCallback((blockId: string, fields: Partial<CompareBlock>) =>
    updateDraft(s => ({ ...s, compareBlocks: s.compareBlocks.map(b => b.id === blockId ? { ...b, ...fields } : b) })), [updateDraft]);
  const deleteCompareBlock = useCallback((blockId: string) =>
    updateDraft(s => ({ ...s, compareBlocks: s.compareBlocks.filter(b => b.id !== blockId) })), [updateDraft]);

  // ── Module operations ──
  const addModule    = useCallback((module: LearningModule) =>
    updateDraft(s => ({ ...s, addedModules: [...s.addedModules, module] })), [updateDraft]);
  const deleteModule = useCallback((moduleId: string) =>
    updateDraft(s => ({
      ...s,
      deletedModules: [...s.deletedModules.filter(id => id !== moduleId), moduleId],
      addedModules: s.addedModules.filter(m => m.id !== moduleId),
    })), [updateDraft]);
  const editModule   = useCallback((moduleId: string, fields: Partial<Pick<LearningModule, "name" | "icon" | "intro" | "enabledTabs">>) =>
    updateDraft(s => ({ ...s, moduleEdits: { ...s.moduleEdits, [moduleId]: { ...s.moduleEdits[moduleId], ...fields } } })), [updateDraft]);

  // ── Generic tab-item operations (fully dynamic, keyed by tabKey) ──
  const getTabOps = useCallback((tabKey: string) => {
    if (!TAB_FIELD_MAP[tabKey]) return null;
    return {
      add: (mid: string, item: ItemRecord) => updateDraft(s => ({
        ...s,
        tabItems: {
          ...s.tabItems,
          [tabKey]: { ...s.tabItems[tabKey], [mid]: [...(s.tabItems[tabKey]?.[mid] ?? []), item] },
        },
      })),
      edit: (mid: string, id: string, fields: ItemRecord) => updateDraft(s => ({
        ...s,
        tabEdits: {
          ...s.tabEdits,
          [tabKey]: { ...s.tabEdits[tabKey], [id]: { ...s.tabEdits[tabKey]?.[id], ...fields, __mid: mid } },
        },
      })),
      del: (mid: string, id: string) => updateDraft(s => ({
        ...s,
        tabItems: {
          ...s.tabItems,
          [tabKey]: { ...s.tabItems[tabKey], [mid]: (s.tabItems[tabKey]?.[mid] ?? []).filter((i: ItemRecord) => i.id !== id) },
        },
        tabDeleted: {
          ...s.tabDeleted,
          [tabKey]: [...(s.tabDeleted[tabKey] ?? []).filter(x => x !== id), id],
        },
      })),
    };
  }, [updateDraft]);

  // ── Computed: merged modules list ──
  const mergedModules: LearningModule[] = [
    ...learningModules
      .filter(m => !store.deletedModules.includes(m.id))
      .map(m => getMergedModule(m, store)),
    ...store.addedModules.filter(m => !store.deletedModules.includes(m.id)),
  ];

  return {
    store, mergedModules, syncStatus, syncMsg, commitTasks,
    hasDraftChanges, beginDraft, commitDraft, discardDraft, clearCommit,
    editNode, addNode, deleteNode, restoreNode,
    addModule, deleteModule, editModule,
    addCompareBlock, editCompareBlock, deleteCompareBlock,
    getTabOps,
  };
}
 