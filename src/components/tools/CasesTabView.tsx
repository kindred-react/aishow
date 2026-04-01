"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, FileText, FolderOpenDot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LifecycleDoc {
  id: string;
  name: string;
  icon: string;
  docsPath: string;
}

interface LifecycleStage {
  id: string;
  name: string;
  icon: string;
  description: string;
  docs: LifecycleDoc[];
}

interface CaseStudy {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  lifecycleStages: LifecycleStage[];
}

interface CasesManifest {
  cases: CaseStudy[];
}

type ViewState = {
  selectedCase: CaseStudy | null;
  expandedStages: Set<string>;
  selectedDoc: { stage: LifecycleStage; doc: LifecycleDoc } | null;
  docContent: string;
  loading: boolean;
};

export function CasesTabView() {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({
    selectedCase: null,
    expandedStages: new Set(["01", "02"]),
    selectedDoc: null,
    docContent: "",
    loading: false,
  });

  useEffect(() => {
    fetch("/api/cases")
      .then((res) => res.json())
      .then((data: CasesManifest) => {
        setCases(data.cases || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleCaseSelect = (caseStudy: CaseStudy) => {
    setViewState((prev) => ({
      ...prev,
      selectedCase: caseStudy,
      expandedStages: new Set(["01", "02"]),
      selectedDoc: null,
      docContent: "",
    }));
  };

  const toggleStage = (stageId: string) => {
    setViewState((prev) => {
      const newExpanded = new Set(prev.expandedStages);
      if (newExpanded.has(stageId)) {
        newExpanded.delete(stageId);
      } else {
        newExpanded.add(stageId);
      }
      return { ...prev, expandedStages: newExpanded };
    });
  };

  const handleDocSelect = async (stage: LifecycleStage, doc: LifecycleDoc) => {
    setViewState((prev) => ({ ...prev, loading: true, selectedDoc: null }));
    try {
      const response = await fetch(doc.docsPath);
      const text = await response.text();
      setViewState((prev) => ({
        ...prev,
        selectedDoc: { stage, doc },
        docContent: text,
        loading: false,
      }));
    } catch {
      setViewState((prev) => ({
        ...prev,
        selectedDoc: { stage, doc },
        docContent: "# 加载失败\n\n无法加载文档内容，请稍后重试。",
        loading: false,
      }));
    }
  };

  if (loading) {
    return (
      <div className="cases-container">
        <div className="cases-loading">
          <div className="cases-loading-spinner" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!viewState.selectedCase) {
    return (
      <div className="cases-container">
        <div className="cases-list-grid">
          {cases.map((caseStudy, index) => (
            <motion.div
              key={caseStudy.id}
              className="case-list-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleCaseSelect(caseStudy)}
              style={{ "--case-color": caseStudy.color } as React.CSSProperties}
            >
              <div className="case-list-card-header">
                <span className="case-list-card-icon">{caseStudy.icon}</span>
                <span className="case-list-card-year">2024</span>
              </div>
              <h3 className="case-list-card-title">{caseStudy.name}</h3>
              <p className="case-list-card-desc">{caseStudy.description}</p>
              <div className="case-list-card-footer">
                <FolderOpenDot size={14} />
                <span>点击选择案例</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="cases-master-detail">
      <div className="cases-sidebar">
        <div className="cases-sidebar-header">
          <button
            className="cases-back-btn"
            onClick={() =>
              setViewState((prev) => ({ ...prev, selectedCase: null }))
            }
          >
            <ChevronRight size={16} className="rotate-180" />
            <span>返回案例</span>
          </button>
          <div className="cases-current-case">
            <span className="case-card-icon">
              {viewState.selectedCase.icon}
            </span>
            <span className="case-card-name">
              {viewState.selectedCase.name}
            </span>
          </div>
        </div>

        <div className="cases-tree">
          {viewState.selectedCase.lifecycleStages.map((stage) => {
            const isExpanded = viewState.expandedStages.has(stage.id);
            const hasDocs = stage.docs.length > 0;

            return (
              <div key={stage.id} className="cases-tree-node">
                <div
                  className={`cases-tree-stage ${hasDocs ? "has-docs" : ""}`}
                  onClick={() => hasDocs && toggleStage(stage.id)}
                >
                  {hasDocs ? (
                    isExpanded ? (
                      <ChevronDown
                        size={14}
                        className="cases-tree-chevron"
                      />
                    ) : (
                      <ChevronRight
                        size={14}
                        className="cases-tree-chevron"
                      />
                    )
                  ) : (
                    <span className="cases-tree-placeholder" />
                  )}
                  <span className="cases-tree-icon">{stage.icon}</span>
                  <span className="cases-tree-label">{stage.name}</span>
                  <span className="cases-tree-count">
                    {stage.docs.length > 0 ? stage.docs.length : ""}
                  </span>
                </div>

                <AnimatePresence>
                  {isExpanded && hasDocs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="cases-tree-children"
                    >
                      {stage.docs.map((doc) => (
                        <div
                          key={doc.id}
                          className={`cases-tree-doc ${
                            viewState.selectedDoc?.doc.id === doc.id
                              ? "active"
                              : ""
                          }`}
                          onClick={() => handleDocSelect(stage, doc)}
                        >
                          <FileText size={12} />
                          <span>{doc.name}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cases-content">
        {viewState.loading ? (
          <div className="cases-loading">
            <div className="cases-loading-spinner" />
            <span>加载中...</span>
          </div>
        ) : viewState.selectedDoc ? (
          <div className="cases-doc-view">
            <div className="cases-doc-header">
              <div className="cases-doc-breadcrumb">
                <span>{viewState.selectedCase.name}</span>
                <ChevronRight size={12} />
                <span>{viewState.selectedDoc.stage.name}</span>
                <ChevronRight size={12} />
                <span className="cases-doc-breadcrumb-current">
                  {viewState.selectedDoc.doc.name}
                </span>
              </div>
            </div>
            <article className="cases-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {viewState.docContent}
              </ReactMarkdown>
            </article>
          </div>
        ) : (
          <div className="cases-empty-content">
            <FileText size={48} />
            <p>选择一个文档查看</p>
            <span>点击左侧的文档名称查看具体内容</span>
          </div>
        )}
      </div>
    </div>
  );
}
