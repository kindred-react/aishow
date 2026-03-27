/**
 * useContentStore — 管理用户对知识库的本地编辑
 * 保存时直接通过 GitHub API 写回对应的 .ts 模块文件
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import type {
  KnowledgeNode, LearningModule, CompareBlock,
  OperationStep, CaseStudy, SkillItem,
  LearningPathNode, InterviewQuestion, CareerMilestone, ToolItem,
} from "@/data/types";
import { learningModules } from "@/data/knowledge";
import { saveModuleNodesToGitHub } from "@/lib/githubNotes";

const LS_KEY = "aishow_content_store";

// Generic per-module list store
type ModuleList<T> = Record<string, T[]>;

export interface ContentStore {
  // ── Knowledge nodes ──
  nodeEdits: Record<string, Partial<KnowledgeNode>>;
  addedNodes: ModuleList<KnowledgeNode>;
  deletedNodes: string[];
  // ── Modules ──
  addedModules: LearningModule[];
  deletedModules: string[];
  moduleEdits: Record<string, Partial<Pick<LearningModule, "name" | "icon" | "intro">>>;
  // ── Compare blocks ──
  compareBlocks: CompareBlock[];
  // ── Tab-specific items ──
  addedOperations: ModuleList<OperationStep>;
  editedOperations: Record<string, Partial<OperationStep>>;
  deletedOperations: string[];
  addedCases: ModuleList<CaseStudy>;
  editedCases: Record<string, Partial<CaseStudy>>;
  deletedCases: string[];
  addedSkills: ModuleList<SkillItem>;
  editedSkills: Record<string, Partial<SkillItem>>;
  deletedSkills: string[];
  addedPathNodes: ModuleList<LearningPathNode>;
  editedPathNodes: Record<string, Partial<LearningPathNode>>;
  deletedPathNodes: string[];
  addedInterviews: ModuleList<InterviewQuestion>;
  editedInterviews: Record<string, Partial<InterviewQuestion>>;
  deletedInterviews: string[];
  addedCareer: ModuleList<CareerMilestone>;
  editedCareer: Record<string, Partial<CareerMilestone>>;
  deletedCareer: string[];
  addedTools: ModuleList<ToolItem>;
  editedTools: Record<string, Partial<ToolItem>>;
  deletedTools: string[];
}

const DEFAULT_STORE: ContentStore = {
  nodeEdits: {}, addedNodes: {}, deletedNodes: [],
  addedModules: [], deletedModules: [], moduleEdits: {},
  compareBlocks: [],
  addedOperations: {}, editedOperations: {}, deletedOperations: [],
  addedCases: {}, editedCases: {}, deletedCases: [],
  addedSkills: {}, editedSkills: {}, deletedSkills: [],
  addedPathNodes: {}, editedPathNodes: {}, deletedPathNodes: [],
  addedInterviews: {}, editedInterviews: {}, deletedInterviews: [],
  addedCareer: {}, editedCareer: {}, deletedCareer: [],
  addedTools: {}, editedTools: {}, deletedTools: [],
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

// Merge a base list with edits/adds/deletes
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
    .map(i => edited[i.id] ? { ...i, ...edited[i.id] } : i); // also apply edits to added items
  return [...merged, ...extra];
}

// 给定模块，计算当前完整的 knowledgeNodes（含本地覆盖）
function getMergedNodes(moduleId: string, store: ContentStore): KnowledgeNode[] {
  const base = learningModules.find(m => m.id === moduleId);
  return mergeList(
    base?.knowledgeNodes ?? [],
    store.addedNodes[moduleId] ?? [],
    store.nodeEdits,
    store.deletedNodes
  );
}

function getMergedModule(m: LearningModule, store: ContentStore): LearningModule {
  const mid = m.id;
  const edit = store.moduleEdits[mid];
  return {
    ...(edit ? { ...m, ...edit } : m),
    knowledgeNodes: getMergedNodes(mid, store),
    operationSteps: mergeList(m.operationSteps, store.addedOperations[mid] ?? [], store.editedOperations, store.deletedOperations),
    cases: mergeList(m.cases, store.addedCases[mid] ?? [], store.editedCases, store.deletedCases),
    skills: mergeList(m.skills ?? [], store.addedSkills[mid] ?? [], store.editedSkills, store.deletedSkills),
    learningPath: mergeList(m.learningPath ?? [], store.addedPathNodes[mid] ?? [], store.editedPathNodes, store.deletedPathNodes),
    interviewQuestions: mergeList(m.interviewQuestions ?? [], store.addedInterviews[mid] ?? [], store.editedInterviews, store.deletedInterviews),
    careerPlan: mergeList(m.careerPlan ?? [], store.addedCareer[mid] ?? [], store.editedCareer, store.deletedCareer),
    tools: mergeList(m.tools ?? [], store.addedTools[mid] ?? [], store.editedTools, store.deletedTools),
  };
}

export function useContentStore() {
  const [store, setStore] = useState<ContentStore>(DEFAULT_STORE);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    // Restore from localStorage after mount (avoids SSR hydration mismatch)
    /* eslint-disable react-hooks/set-state-in-effect */
    setStore(loadLocal());
    /* eslint-enable react-hooks/set-state-in-effect */
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

  // ── Compare Block operations ──
  const addCompareBlock = useCallback((block: CompareBlock) => {
    setStore(prev => {
      const next = { ...prev, compareBlocks: [...prev.compareBlocks, block] };
      saveLocal(next);
      return next;
    });
  }, []);

  const editCompareBlock = useCallback((blockId: string, fields: Partial<CompareBlock>) => {
    setStore(prev => {
      const next = {
        ...prev,
        compareBlocks: prev.compareBlocks.map(b =>
          b.id === blockId ? { ...b, ...fields } : b
        ),
      };
      saveLocal(next);
      return next;
    });
  }, []);

  const deleteCompareBlock = useCallback((blockId: string) => {
    setStore(prev => {
      const next = { ...prev, compareBlocks: prev.compareBlocks.filter(b => b.id !== blockId) };
      saveLocal(next);
      return next;
    });
  }, []);

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

  // ── Tab-item ops (operation / cases / skills / path / interview / career) ──
  const addOperation    = useCallback((mid: string, item: OperationStep)      => { setStore(prev => { const l = prev.addedOperations; const n = {...prev, addedOperations: {...l, [mid]: [...(l[mid]??[]), item]}}; saveLocal(n); return n; }); }, []);
  const editOperation   = useCallback((id: string,  f: Partial<OperationStep>)   => { setStore(prev => { const e = prev.editedOperations; const n = {...prev, editedOperations: {...e, [id]: {...e[id], ...f}}}; saveLocal(n); return n; }); }, []);
  const deleteOperation = useCallback((mid: string, id: string)                => { setStore(prev => { const l = prev.addedOperations; const n = {...prev, deletedOperations: [...prev.deletedOperations.filter(x=>x!==id), id], addedOperations: {...l, [mid]: (l[mid]??[]).filter(i=>i.id!==id)}}; saveLocal(n); return n; }); }, []);

  const addCase    = useCallback((mid: string, item: CaseStudy)           => { setStore(prev => { const l = prev.addedCases; const n = {...prev, addedCases: {...l, [mid]: [...(l[mid]??[]), item]}}; saveLocal(n); return n; }); }, []);
  const editCase   = useCallback((id: string,  f: Partial<CaseStudy>)      => { setStore(prev => { const e = prev.editedCases; const n = {...prev, editedCases: {...e, [id]: {...e[id], ...f}}}; saveLocal(n); return n; }); }, []);
  const deleteCase = useCallback((mid: string, id: string)                => { setStore(prev => { const l = prev.addedCases; const n = {...prev, deletedCases: [...prev.deletedCases.filter(x=>x!==id), id], addedCases: {...l, [mid]: (l[mid]??[]).filter(i=>i.id!==id)}}; saveLocal(n); return n; }); }, []);

  const addSkill    = useCallback((mid: string, item: SkillItem)          => { setStore(prev => { const l = prev.addedSkills; const n = {...prev, addedSkills: {...l, [mid]: [...(l[mid]??[]), item]}}; saveLocal(n); return n; }); }, []);
  const editSkill   = useCallback((id: string,  f: Partial<SkillItem>)     => { setStore(prev => { const e = prev.editedSkills; const n = {...prev, editedSkills: {...e, [id]: {...e[id], ...f}}}; saveLocal(n); return n; }); }, []);
  const deleteSkill = useCallback((mid: string, id: string)               => { setStore(prev => { const l = prev.addedSkills; const n = {...prev, deletedSkills: [...prev.deletedSkills.filter(x=>x!==id), id], addedSkills: {...l, [mid]: (l[mid]??[]).filter(i=>i.id!==id)}}; saveLocal(n); return n; }); }, []);

  const addPathNode    = useCallback((mid: string, item: LearningPathNode)     => { setStore(prev => { const l = prev.addedPathNodes; const n = {...prev, addedPathNodes: {...l, [mid]: [...(l[mid]??[]), item]}}; saveLocal(n); return n; }); }, []);
  const editPathNode   = useCallback((id: string,  f: Partial<LearningPathNode>) => { setStore(prev => { const e = prev.editedPathNodes; const n = {...prev, editedPathNodes: {...e, [id]: {...e[id], ...f}}}; saveLocal(n); return n; }); }, []);
  const deletePathNode = useCallback((mid: string, id: string)                 => { setStore(prev => { const l = prev.addedPathNodes; const n = {...prev, deletedPathNodes: [...prev.deletedPathNodes.filter(x=>x!==id), id], addedPathNodes: {...l, [mid]: (l[mid]??[]).filter(i=>i.id!==id)}}; saveLocal(n); return n; }); }, []);

  const addInterview    = useCallback((mid: string, item: InterviewQuestion)     => { setStore(prev => { const l = prev.addedInterviews; const n = {...prev, addedInterviews: {...l, [mid]: [...(l[mid]??[]), item]}}; saveLocal(n); return n; }); }, []);
  const editInterview   = useCallback((id: string,  f: Partial<InterviewQuestion>) => { setStore(prev => { const e = prev.editedInterviews; const n = {...prev, editedInterviews: {...e, [id]: {...e[id], ...f}}}; saveLocal(n); return n; }); }, []);
  const deleteInterview = useCallback((mid: string, id: string)                  => { setStore(prev => { const l = prev.addedInterviews; const n = {...prev, deletedInterviews: [...prev.deletedInterviews.filter(x=>x!==id), id], addedInterviews: {...l, [mid]: (l[mid]??[]).filter(i=>i.id!==id)}}; saveLocal(n); return n; }); }, []);

  const addCareer    = useCallback((mid: string, item: CareerMilestone)    => { setStore(prev => { const l = prev.addedCareer; const n = {...prev, addedCareer: {...l, [mid]: [...(l[mid]??[]), item]}}; saveLocal(n); return n; }); }, []);
  const editCareer   = useCallback((id: string,  f: Partial<CareerMilestone>) => { setStore(prev => { const e = prev.editedCareer; const n = {...prev, editedCareer: {...e, [id]: {...e[id], ...f}}}; saveLocal(n); return n; }); }, []);
  const deleteCareer = useCallback((mid: string, id: string)               => { setStore(prev => { const l = prev.addedCareer; const n = {...prev, deletedCareer: [...prev.deletedCareer.filter(x=>x!==id), id], addedCareer: {...l, [mid]: (l[mid]??[]).filter(i=>i.id!==id)}}; saveLocal(n); return n; }); }, []);

  const addTool    = useCallback((mid: string, item: ToolItem)    => { setStore(prev => { const l = prev.addedTools; const n = {...prev, addedTools: {...l, [mid]: [...(l[mid]??[]), item]}}; saveLocal(n); return n; }); }, []);
  const editTool   = useCallback((id: string,  f: Partial<ToolItem>) => { setStore(prev => { const e = prev.editedTools; const n = {...prev, editedTools: {...e, [id]: {...e[id], ...f}}}; saveLocal(n); return n; }); }, []);
  const deleteTool = useCallback((mid: string, id: string)               => { setStore(prev => { const l = prev.addedTools; const n = {...prev, deletedTools: [...prev.deletedTools.filter(x=>x!==id), id], addedTools: {...l, [mid]: (l[mid]??[]).filter(i=>i.id!==id)}}; saveLocal(n); return n; }); }, []);

  // ── Computed: merged modules list ──
  const mergedModules: LearningModule[] = [
    ...learningModules
      .filter(m => !store.deletedModules.includes(m.id))
      .map(m => getMergedModule(m, store)),
    ...store.addedModules.filter(m => !store.deletedModules.includes(m.id)),
  ];

  return {
    store, mergedModules, syncStatus, syncMsg,
    editNode, addNode, deleteNode, restoreNode,
    addModule, deleteModule, editModule,
    addCompareBlock, editCompareBlock, deleteCompareBlock,
    addOperation, editOperation, deleteOperation,
    addCase, editCase, deleteCase,
    addSkill, editSkill, deleteSkill,
    addPathNode, editPathNode, deletePathNode,
    addInterview, editInterview, deleteInterview,
    addCareer, editCareer, deleteCareer,
    addTool, editTool, deleteTool,
  };
}
