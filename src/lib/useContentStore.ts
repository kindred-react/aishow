/**
 * useContentStore — 统一管理用户对知识库的所有本地编辑
 * 数据存在 localStorage，同时支持同步到 GitHub
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import type { KnowledgeNode, LearningModule } from "@/data/types";
import { learningModules } from "@/data/knowledge";

const LS_KEY = "aishow_content_store";

export interface ContentStore {
  // 卡片编辑: nodeId → 覆盖字段
  nodeEdits: Record<string, Partial<KnowledgeNode>>;
  // 新增卡片: moduleId → 新卡片列表
  addedNodes: Record<string, KnowledgeNode[]>;
  // 删除卡片: nodeId set
  deletedNodes: string[];
  // 新增模块
  addedModules: LearningModule[];
  // 删除模块: moduleId set
  deletedModules: string[];
  // 模块编辑: moduleId → 覆盖字段
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

function load(): ContentStore {
  if (typeof window === "undefined") return DEFAULT_STORE;
  try {
    return { ...DEFAULT_STORE, ...JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") };
  } catch { return DEFAULT_STORE; }
}

function save(store: ContentStore) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
  // Defer dispatch to avoid setState-during-render
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("content-store-updated", { detail: store }));
  }, 0);
}

export function useContentStore() {
  const [store, setStore] = useState<ContentStore>(DEFAULT_STORE);

  useEffect(() => {
    setStore(load());
    const handler = (e: Event) => setStore((e as CustomEvent).detail as ContentStore);
    window.addEventListener("content-store-updated", handler);
    window.addEventListener("storage", () => setStore(load()));
    return () => window.removeEventListener("content-store-updated", handler);
  }, []);

  const update = useCallback((fn: (s: ContentStore) => ContentStore) => {
    setStore(prev => {
      const next = fn(prev);
      save(next);
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
      // Also remove from addedNodes if it was a user-created node
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
    editNode,
    addNode,
    deleteNode,
    restoreNode,
    addModule,
    deleteModule,
    editModule,
  };
}
