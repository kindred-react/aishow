/**
 * useContentStore — 统一管理用户对知识库的所有本地编辑
 * 数据存在 localStorage，同时通过 GitHub API 同步到代码仓库
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import type { KnowledgeNode, LearningModule } from "@/data/types";
import { learningModules } from "@/data/knowledge";
import { userContentStore } from "@/data/userStore";
import { saveStoreToGitHub } from "@/lib/githubNotes";

const LS_KEY = "aishow_content_store";

export interface ContentStore {
  nodeEdits: Record<string, Partial<KnowledgeNode>>;
  addedNodes: Record<string, KnowledgeNode[]>;
  deletedNodes: string[];
  addedModules: LearningModule[];
  deletedModules: string[];
  moduleEdits: Record<string, Partial<Pick<LearningModule, "name" | "icon" | "intro">>>;
}

const DEFAULT_STORE: ContentStore = {
  nodeEdits: {},
  addedNodes: {},
  deletedNodes: [],
  addedModules: [],
  deletedModules: [],
  moduleEdits: {},
};

// Merge: localStorage takes priority over userStore.ts (server data)
function loadInitial(): ContentStore {
  if (typeof window === "undefined") return DEFAULT_STORE;
  try {
    const local = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
    // If localStorage is empty, seed from server-side userStore.ts
    const hasLocal = Object.keys(local).length > 0;
    if (!hasLocal) {
      return { ...DEFAULT_STORE, ...userContentStore };
    }
    return { ...DEFAULT_STORE, ...local };
  } catch { return DEFAULT_STORE; }
}

function saveLocal(store: ContentStore) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("content-store-updated", { detail: store }));
  }, 0);
}

export function useContentStore() {
  const [store, setStore] = useState<ContentStore>(DEFAULT_STORE);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    setStore(loadInitial());
    const handler = (e: Event) => setStore((e as CustomEvent).detail as ContentStore);
    window.addEventListener("content-store-updated", handler);
    window.addEventListener("storage", () => setStore(loadInitial()));
    return () => window.removeEventListener("content-store-updated", handler);
  }, []);

  const update = useCallback((fn: (s: ContentStore) => ContentStore) => {
    setStore(prev => {
      const next = fn(prev);
      saveLocal(next);
      // Async sync to GitHub
      setSyncStatus("syncing");
      saveStoreToGitHub({ ...next, lastUpdated: new Date().toISOString() })
        .then(result => {
          setSyncStatus(result.ok ? "done" : "error");
          setSyncMsg(result.message);
          setTimeout(() => { setSyncStatus("idle"); setSyncMsg(""); }, 4000);
        });
      return next;
    });
  }, []);

  // ── Node operations ──
  const editNode = useCallback((nodeId: string, fields: Partial<KnowledgeNode>) => {
    update(s => ({
      ...s,
      nodeEdits: { ...s.nodeEdits, [nodeId]: { ...s.nodeEdits[nodeId], ...fields } },
    }));
  }, [update]);

  const addNode = useCallback((moduleId: string, node: KnowledgeNode) => {
    update(s => ({
      ...s,
      addedNodes: { ...s.addedNodes, [moduleId]: [...(s.addedNodes[moduleId] ?? []), node] },
    }));
  }, [update]);

  const deleteNode = useCallback((nodeId: string) => {
    update(s => ({
      ...s,
      deletedNodes: [...s.deletedNodes.filter(id => id !== nodeId), nodeId],
      addedNodes: Object.fromEntries(
        Object.entries(s.addedNodes).map(([mid, nodes]) =>
          [mid, nodes.filter(n => n.id !== nodeId)]
        )
      ),
    }));
  }, [update]);

  const restoreNode = useCallback((nodeId: string) => {
    update(s => ({
      ...s,
      deletedNodes: s.deletedNodes.filter(id => id !== nodeId),
      nodeEdits: Object.fromEntries(Object.entries(s.nodeEdits).filter(([id]) => id !== nodeId)),
    }));
  }, [update]);

  // ── Module operations ──
  const addModule = useCallback((module: LearningModule) => {
    update(s => ({ ...s, addedModules: [...s.addedModules, module] }));
  }, [update]);

  const deleteModule = useCallback((moduleId: string) => {
    update(s => ({
      ...s,
      deletedModules: [...s.deletedModules.filter(id => id !== moduleId), moduleId],
      addedModules: s.addedModules.filter(m => m.id !== moduleId),
    }));
  }, [update]);

  const editModule = useCallback((moduleId: string, fields: Partial<Pick<LearningModule, "name" | "icon" | "intro">>) => {
    update(s => ({
      ...s,
      moduleEdits: { ...s.moduleEdits, [moduleId]: { ...s.moduleEdits[moduleId], ...fields } },
    }));
  }, [update]);

  // ── Computed: merged modules list ──
  const mergedModules: LearningModule[] = [
    ...learningModules
      .filter(m => !store.deletedModules.includes(m.id))
      .map(m => {
        const edit = store.moduleEdits[m.id];
        const baseNodes = m.knowledgeNodes
          .filter(n => !store.deletedNodes.includes(n.id))
          .map(n => store.nodeEdits[n.id] ? { ...n, ...store.nodeEdits[n.id] } : n);
        const extraNodes = store.addedNodes[m.id] ?? [];
        return edit
          ? { ...m, ...edit, knowledgeNodes: [...baseNodes, ...extraNodes] }
          : { ...m, knowledgeNodes: [...baseNodes, ...extraNodes] };
      }),
    ...store.addedModules.filter(m => !store.deletedModules.includes(m.id)),
  ];

  return {
    store,
    mergedModules,
    syncStatus,
    syncMsg,
    editNode,
    addNode,
    deleteNode,
    restoreNode,
    addModule,
    deleteModule,
    editModule,
  };
}
