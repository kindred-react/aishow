/**
 * useContentStore — 管理用户对知识库的本地编辑
 * 保存时直接通过 GitHub API 写回对应的 .ts 模块文件
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import type { KnowledgeNode, LearningModule } from "@/data/types";
import { learningModules } from "@/data/knowledge";
import { saveModuleNodesToGitHub } from "@/lib/githubNotes";

const LS_KEY = "aishow_content_store";

export interface ContentStore {
  // 对原始节点的覆盖（key = nodeId）
  nodeEdits: Record<string, Partial<KnowledgeNode>>;
  // 每个模块新增的节点
  addedNodes: Record<string, KnowledgeNode[]>;
  // 已删除的节点 id
  deletedNodes: string[];
  // 新增的模块
  addedModules: LearningModule[];
  // 已删除的模块 id
  deletedModules: string[];
  // 模块名称/图标/简介编辑
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

function loadLocal(): ContentStore {
  if (typeof window === "undefined") return DEFAULT_STORE;
  try {
    return { ...DEFAULT_STORE, ...JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") };
  } catch { return DEFAULT_STORE; }
}

function saveLocal(store: ContentStore) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("content-store-updated", { detail: store }));
  }, 0);
}

// 给定模块，计算当前完整的 knowledgeNodes（含本地覆盖）
function getMergedNodes(moduleId: string, store: ContentStore): KnowledgeNode[] {
  const base = learningModules.find(m => m.id === moduleId);
  const baseNodes = (base?.knowledgeNodes ?? [])
    .filter(n => !store.deletedNodes.includes(n.id))
    .map(n => store.nodeEdits[n.id] ? { ...n, ...store.nodeEdits[n.id] } : n);
  const baseIds = new Set(baseNodes.map(n => n.id));
  const extraNodes = (store.addedNodes[moduleId] ?? [])
    .filter(n => !store.deletedNodes.includes(n.id))
    .filter(n => !baseIds.has(n.id));
  return [...baseNodes, ...extraNodes];
}

export function useContentStore() {
  const [store, setStore] = useState<ContentStore>(DEFAULT_STORE);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    setStore(loadLocal());
    const handler = (e: Event) => setStore((e as CustomEvent).detail as ContentStore);
    window.addEventListener("content-store-updated", handler);
    window.addEventListener("storage", () => setStore(loadLocal()));
    return () => window.removeEventListener("content-store-updated", handler);
  }, []);

  const syncToGitHub = useCallback((moduleId: string, nextStore: ContentStore) => {
    const nodes = getMergedNodes(moduleId, nextStore);
    setSyncStatus("syncing");
    saveModuleNodesToGitHub(moduleId, nodes).then(result => {
      setSyncStatus(result.ok ? "done" : "error");
      setSyncMsg(result.message);
      setTimeout(() => { setSyncStatus("idle"); setSyncMsg(""); }, 4000);
    });
  }, []);

  const update = useCallback((moduleId: string, fn: (s: ContentStore) => ContentStore) => {
    setStore(prev => {
      const next = fn(prev);
      saveLocal(next);
      syncToGitHub(moduleId, next);
      return next;
    });
  }, [syncToGitHub]);

  // ── Node operations ──
  const editNode = useCallback((moduleId: string, nodeId: string, fields: Partial<KnowledgeNode>) => {
    update(moduleId, s => ({
      ...s,
      nodeEdits: { ...s.nodeEdits, [nodeId]: { ...s.nodeEdits[nodeId], ...fields } },
      // 防止重复：从 addedNodes 里移除同 id
      addedNodes: Object.fromEntries(
        Object.entries(s.addedNodes).map(([mid, nodes]) =>
          [mid, nodes.filter(n => n.id !== nodeId)]
        )
      ),
    }));
  }, [update]);

  const addNode = useCallback((moduleId: string, node: KnowledgeNode) => {
    update(moduleId, s => ({
      ...s,
      addedNodes: { ...s.addedNodes, [moduleId]: [...(s.addedNodes[moduleId] ?? []), node] },
    }));
  }, [update]);

  const deleteNode = useCallback((moduleId: string, nodeId: string) => {
    update(moduleId, s => ({
      ...s,
      deletedNodes: [...s.deletedNodes.filter(id => id !== nodeId), nodeId],
      addedNodes: Object.fromEntries(
        Object.entries(s.addedNodes).map(([mid, nodes]) =>
          [mid, nodes.filter(n => n.id !== nodeId)]
        )
      ),
    }));
  }, [update]);

  const restoreNode = useCallback((moduleId: string, nodeId: string) => {
    update(moduleId, s => ({
      ...s,
      deletedNodes: s.deletedNodes.filter(id => id !== nodeId),
      nodeEdits: Object.fromEntries(Object.entries(s.nodeEdits).filter(([id]) => id !== nodeId)),
    }));
  }, [update]);

  // ── Module operations (no GitHub sync for now) ──
  const addModule = useCallback((module: LearningModule) => {
    setStore(prev => {
      const next = { ...prev, addedModules: [...prev.addedModules, module] };
      saveLocal(next);
      return next;
    });
  }, []);

  const deleteModule = useCallback((moduleId: string) => {
    setStore(prev => {
      const next = {
        ...prev,
        deletedModules: [...prev.deletedModules.filter(id => id !== moduleId), moduleId],
        addedModules: prev.addedModules.filter(m => m.id !== moduleId),
      };
      saveLocal(next);
      return next;
    });
  }, []);

  const editModule = useCallback((moduleId: string, fields: Partial<Pick<LearningModule, "name" | "icon" | "intro">>) => {
    setStore(prev => {
      const next = {
        ...prev,
        moduleEdits: { ...prev.moduleEdits, [moduleId]: { ...prev.moduleEdits[moduleId], ...fields } },
      };
      saveLocal(next);
      return next;
    });
  }, []);

  // ── Computed: merged modules list ──
  const mergedModules: LearningModule[] = [
    ...learningModules
      .filter(m => !store.deletedModules.includes(m.id))
      .map(m => {
        const edit = store.moduleEdits[m.id];
        const nodes = getMergedNodes(m.id, store);
        return edit ? { ...m, ...edit, knowledgeNodes: nodes } : { ...m, knowledgeNodes: nodes };
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
