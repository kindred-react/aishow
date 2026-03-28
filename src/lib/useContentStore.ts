/**
 * useContentStore — 管理用户对知识库的本地编辑
 * 保存时直接通过 GitHub API 写回对应的 .ts 模块文件
 */
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type {
  KnowledgeNode, LearningModule, CompareBlock,
  OperationStep, CaseStudy, SkillItem,
  LearningPathNode, InterviewQuestion, CareerMilestone, ToolItem,
} from "@/data/types";
import { learningModules } from "@/data/knowledge";
import { compareBlocks as staticCompareBlocks } from "@/data/compareBlocks";
import { pushChangesToGitHub, pushCompareBlocksToGitHub, pushKnowledgeIndexToGitHub } from "@/lib/githubNotes";

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
  moduleEdits: Record<string, Partial<Pick<LearningModule, "name" | "icon" | "intro" | "enabledTabs">>>;
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
  compareBlocks: staticCompareBlocks,
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
    const persisted = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Partial<ContentStore>;
    // Merge static compareBlocks with locally-drafted ones.
    // Static blocks (from GitHub) are the base; local draft additions/edits override/append.
    const localBlocks: CompareBlock[] = persisted.compareBlocks ?? [];
    const staticIds = new Set(staticCompareBlocks.map(b => b.id));
    const localOnly = localBlocks.filter(b => !staticIds.has(b.id));
    // For blocks that exist in static, prefer the local version (user may have edited)
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
  // savedStore = persisted to localStorage; draftStore = in-memory edits during edit mode
  const [savedStore, setSavedStore] = useState<ContentStore>(DEFAULT_STORE);
  const savedStoreRef = useRef<ContentStore>(DEFAULT_STORE);
  const [draftStore, setDraftStore] = useState<ContentStore | null>(null);

  // The active store for rendering: draft when editing, saved otherwise
  const store = draftStore ?? savedStore;

  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    // Restore from localStorage after mount (avoids SSR hydration mismatch)
    /* eslint-disable react-hooks/set-state-in-effect */
    const initial = loadLocal();
    setSavedStore(initial);
    savedStoreRef.current = initial;
    /* eslint-enable react-hooks/set-state-in-effect */
    const handler = (e: Event) => {
      const s = (e as CustomEvent).detail as ContentStore;
      setSavedStore(s);
      savedStoreRef.current = s;
    };
    const storageHandler = () => {
      const s = loadLocal();
      setSavedStore(s);
      savedStoreRef.current = s;
    };
    window.addEventListener("content-store-updated", handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("content-store-updated", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  // Call when entering edit mode — fork a draft from the current saved state
  const beginDraft = useCallback(() => {
    const current = loadLocal();
    setSavedStore(current);
    savedStoreRef.current = current;
    setDraftStore(current);
  }, []);

  // Commit draft to localStorage and trigger GitHub push
  const commitDraft = useCallback((mergedModules: LearningModule[]) => {
    setDraftStore(prev => {
      if (!prev) return null;
      saveLocal(prev);
      setSavedStore(prev);
      savedStoreRef.current = prev;

      // Determine which module IDs have changes
      const changedIds = new Set<string>([
        // ── edits / adds (keyed by moduleId directly) ──
        ...prev.addedModules.map(m => m.id),
        ...Object.keys(prev.addedNodes),
        ...Object.keys(prev.addedOperations),
        ...Object.keys(prev.addedCases),
        ...Object.keys(prev.addedSkills),
        ...Object.keys(prev.addedPathNodes),
        ...Object.keys(prev.addedInterviews),
        ...Object.keys(prev.addedCareer),
        ...Object.keys(prev.addedTools),
        ...Object.keys(prev.moduleEdits),
        // ── edits keyed by item id → reverse-lookup module ──
        ...Object.keys(prev.nodeEdits).flatMap(nodeId =>
          mergedModules.filter(m => m.knowledgeNodes.some(n => n.id === nodeId)).map(m => m.id)
        ),
        ...Object.keys(prev.editedOperations).flatMap(id =>
          mergedModules.filter(m => m.operationSteps.some(s => s.id === id)).map(m => m.id)
        ),
        ...Object.keys(prev.editedCases).flatMap(id =>
          mergedModules.filter(m => m.cases.some(c => c.id === id)).map(m => m.id)
        ),
        ...Object.keys(prev.editedSkills).flatMap(id =>
          mergedModules.filter(m => m.skills?.some(s => s.id === id)).map(m => m.id)
        ),
        ...Object.keys(prev.editedPathNodes).flatMap(id =>
          mergedModules.filter(m => m.learningPath?.some(p => p.id === id)).map(m => m.id)
        ),
        ...Object.keys(prev.editedInterviews).flatMap(id =>
          mergedModules.filter(m => m.interviewQuestions?.some(q => q.id === id)).map(m => m.id)
        ),
        ...Object.keys(prev.editedCareer).flatMap(id =>
          mergedModules.filter(m => m.careerPlan?.some(c => c.id === id)).map(m => m.id)
        ),
        ...Object.keys(prev.editedTools).flatMap(id =>
          mergedModules.filter(m => m.tools?.some(t => t.id === id)).map(m => m.id)
        ),
        // ── deletes → reverse-lookup via savedStore (before merge) ──
        ...prev.deletedNodes.flatMap(id =>
          mergedModules.filter(m =>
            learningModules.find(b => b.id === m.id)?.knowledgeNodes.some(n => n.id === id)
          ).map(m => m.id)
        ),
        ...prev.deletedOperations.flatMap(id =>
          mergedModules.filter(m =>
            learningModules.find(b => b.id === m.id)?.operationSteps.some(s => s.id === id)
          ).map(m => m.id)
        ),
        ...prev.deletedCases.flatMap(id =>
          mergedModules.filter(m =>
            learningModules.find(b => b.id === m.id)?.cases.some(c => c.id === id)
          ).map(m => m.id)
        ),
        ...prev.deletedSkills.flatMap(id =>
          mergedModules.filter(m =>
            learningModules.find(b => b.id === m.id)?.skills?.some(s => s.id === id)
          ).map(m => m.id)
        ),
        ...prev.deletedPathNodes.flatMap(id =>
          mergedModules.filter(m =>
            learningModules.find(b => b.id === m.id)?.learningPath?.some(p => p.id === id)
          ).map(m => m.id)
        ),
        ...prev.deletedInterviews.flatMap(id =>
          mergedModules.filter(m =>
            learningModules.find(b => b.id === m.id)?.interviewQuestions?.some(q => q.id === id)
          ).map(m => m.id)
        ),
        ...prev.deletedCareer.flatMap(id =>
          mergedModules.filter(m =>
            learningModules.find(b => b.id === m.id)?.careerPlan?.some(c => c.id === id)
          ).map(m => m.id)
        ),
        ...prev.deletedTools.flatMap(id =>
          mergedModules.filter(m =>
            learningModules.find(b => b.id === m.id)?.tools?.some(t => t.id === id)
          ).map(m => m.id)
        ),
        ...prev.deletedModules, // deleted modules still need to be pushed (handled as empty)
      ]);

      const ids = [...changedIds].filter(id => id);
      // Use ref to get the actual saved state at commit time (avoids stale closure)
      const hasCompareChanges = JSON.stringify(prev.compareBlocks) !== JSON.stringify(savedStoreRef.current.compareBlocks);
      // knowledge.ts index needs updating when modules are added or deleted
      const hasModuleStructureChanges = prev.addedModules.length > 0 || prev.deletedModules.length > 0;
      if (ids.length > 0 || hasCompareChanges || hasModuleStructureChanges) {
        setSyncStatus("syncing");
        setSyncMsg("正在推送到 GitHub…");
        const pushTasks: Promise<{ ok: boolean; message: string }>[] = [];
        if (ids.length > 0) pushTasks.push(pushChangesToGitHub(ids, mergedModules));
        if (hasCompareChanges) pushTasks.push(pushCompareBlocksToGitHub(prev.compareBlocks));
        if (hasModuleStructureChanges) pushTasks.push(pushKnowledgeIndexToGitHub(mergedModules));
        Promise.all(pushTasks).then(results => {
          const failed = results.filter(r => !r.ok);
          setSyncStatus(failed.length === 0 ? "done" : "error");
          setSyncMsg(failed.length === 0
            ? results.map(r => r.message).join("；")
            : failed.map(r => r.message).join("；")
          );
          setTimeout(() => { setSyncStatus("idle"); setSyncMsg(""); }, 6000);
        });
      }
      return null;
    });
  }, []);

  // Discard draft — revert to saved state
  const discardDraft = useCallback(() => {
    setDraftStore(null);
  }, []);

  // Whether there are unsaved changes in the draft
  const hasDraftChanges = draftStore !== null && JSON.stringify(draftStore) !== JSON.stringify(savedStore);

  // All mutations write to draftStore only (not localStorage)
  const updateDraft = useCallback((fn: (s: ContentStore) => ContentStore) => {
    setDraftStore(prev => fn(prev ?? savedStore));
  }, [savedStore]);

  // ── Node operations ──
  const editNode = useCallback((moduleId: string, nodeId: string, fields: Partial<KnowledgeNode>) => {
    updateDraft(s => ({
      ...s,
      nodeEdits: { ...s.nodeEdits, [nodeId]: { ...s.nodeEdits[nodeId], ...fields } },
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

  // ── Compare Block operations ──
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

  // ── Tab-item ops factory ──
  // Each tab type follows the same add/edit/delete pattern.
  // makeTabOps generates the three callbacks to avoid repeating the same setStore shape 7 times.
  function makeTabOps<T extends { id: string }>(
    getAdded: (s: ContentStore) => ModuleList<T>,
    getEdited: (s: ContentStore) => Record<string, Partial<T>>,
    getDeleted: (s: ContentStore) => string[],
    setAdded: (s: ContentStore, v: ModuleList<T>) => ContentStore,
    setEdited: (s: ContentStore, v: Record<string, Partial<T>>) => ContentStore,
    setDeleted: (s: ContentStore, v: string[]) => ContentStore,
  ) {
    const add = (mid: string, item: T) => updateDraft(s => {
      const l = getAdded(s);
      return setAdded(s, { ...l, [mid]: [...(l[mid] ?? []), item] });
    });
    const edit = (id: string, f: Partial<T>) => updateDraft(s => {
      const e = getEdited(s);
      return setEdited(s, { ...e, [id]: { ...e[id], ...f } });
    });
    const del = (mid: string, id: string) => updateDraft(s => {
      const l = getAdded(s);
      return setDeleted(
        setAdded(s, { ...l, [mid]: (l[mid] ?? []).filter(i => i.id !== id) }),
        [...getDeleted(s).filter(x => x !== id), id],
      );
    });
    return { add, edit, del };
  }

  const opOps       = makeTabOps<OperationStep>(s => s.addedOperations, s => s.editedOperations, s => s.deletedOperations, (s,v) => ({...s,addedOperations:v}), (s,v) => ({...s,editedOperations:v}), (s,v) => ({...s,deletedOperations:v}));
  const caseOps     = makeTabOps<CaseStudy>(s => s.addedCases, s => s.editedCases, s => s.deletedCases, (s,v) => ({...s,addedCases:v}), (s,v) => ({...s,editedCases:v}), (s,v) => ({...s,deletedCases:v}));
  const skillOps    = makeTabOps<SkillItem>(s => s.addedSkills, s => s.editedSkills, s => s.deletedSkills, (s,v) => ({...s,addedSkills:v}), (s,v) => ({...s,editedSkills:v}), (s,v) => ({...s,deletedSkills:v}));
  const pathOps     = makeTabOps<LearningPathNode>(s => s.addedPathNodes, s => s.editedPathNodes, s => s.deletedPathNodes, (s,v) => ({...s,addedPathNodes:v}), (s,v) => ({...s,editedPathNodes:v}), (s,v) => ({...s,deletedPathNodes:v}));
  const interviewOps= makeTabOps<InterviewQuestion>(s => s.addedInterviews, s => s.editedInterviews, s => s.deletedInterviews, (s,v) => ({...s,addedInterviews:v}), (s,v) => ({...s,editedInterviews:v}), (s,v) => ({...s,deletedInterviews:v}));
  const careerOps   = makeTabOps<CareerMilestone>(s => s.addedCareer, s => s.editedCareer, s => s.deletedCareer, (s,v) => ({...s,addedCareer:v}), (s,v) => ({...s,editedCareer:v}), (s,v) => ({...s,deletedCareer:v}));
  const toolOps     = makeTabOps<ToolItem>(s => s.addedTools, s => s.editedTools, s => s.deletedTools, (s,v) => ({...s,addedTools:v}), (s,v) => ({...s,editedTools:v}), (s,v) => ({...s,deletedTools:v}));

  const addOperation    = opOps.add;
  const editOperation   = opOps.edit;
  const deleteOperation = opOps.del;
  const addCase         = caseOps.add;
  const editCase        = caseOps.edit;
  const deleteCase      = caseOps.del;
  const addSkill        = skillOps.add;
  const editSkill       = skillOps.edit;
  const deleteSkill     = skillOps.del;
  const addPathNode     = pathOps.add;
  const editPathNode    = pathOps.edit;
  const deletePathNode  = pathOps.del;
  const addInterview    = interviewOps.add;
  const editInterview   = interviewOps.edit;
  const deleteInterview = interviewOps.del;
  const addCareer       = careerOps.add;
  const editCareer      = careerOps.edit;
  const deleteCareer    = careerOps.del;
  const addTool         = toolOps.add;
  const editTool        = toolOps.edit;
  const deleteTool      = toolOps.del;

  // ── Computed: merged modules list ──
  const mergedModules: LearningModule[] = [
    ...learningModules
      .filter(m => !store.deletedModules.includes(m.id))
      .map(m => getMergedModule(m, store)),
    ...store.addedModules.filter(m => !store.deletedModules.includes(m.id)),
  ];

  return {
    store, mergedModules, syncStatus, syncMsg,
    hasDraftChanges, beginDraft, commitDraft, discardDraft,
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
