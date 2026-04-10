'use client';
/* eslint-disable react-hooks/set-state-in-effect -- fetch + URL sync + scroll restore use intentional effect-driven state */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AtlasRouteSwitch } from '@/components/shared/AtlasRouteSwitch';
import { loadInterviewState, saveInterviewState } from '@/lib/interviewPersistence';

interface Document {
  slug: string;
  title: string;
  description: string;
  category: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const SCROLL_SAVE_MS = 450;
const DOC_BASE = '/interview';

function buildDocPath(slug: string): string {
  const segments = slug.split('/').filter(Boolean).map((s) => encodeURIComponent(s));
  return `${DOC_BASE}/${segments.join('/')}`;
}

function safeDecodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function InterviewKnowledgeClient() {
  const params = useParams();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [content, setContent] = useState<string>('');
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);
  const [selectionReady, setSelectionReady] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const mainRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const activeIdRef = useRef<string>('');
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didRestoreScroll = useRef(false);
  const pendingHash = useRef<string | null>(null);
  /** Match KnowledgeBoard / ToolsPageView: `.page-shell` is opacity:0 until `.mounted` */
  const [shellMounted, setShellMounted] = useState(false);
  useEffect(() => {
    setShellMounted(true);
  }, []);

  const shellClass = `page-shell${shellMounted ? ' mounted' : ''}`;

  const urlSlug = Array.isArray(params?.slug)
    ? params.slug.map(safeDecodeSegment).join('/')
    : '';

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/interview/docs/list');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
        setCategories(data.categories);
      }
    } catch {
      console.error('Failed to fetch documents');
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /** Resolve URL vs localStorage vs first doc — runs once when documents arrive */
  useEffect(() => {
    if (selectionReady) return;
    if (loadingList) return;
    if (documents.length === 0) {
      setSelectionReady(true);
      return;
    }

    const persisted = loadInterviewState();

    let doc: Document | undefined;
    if (urlSlug) {
      doc = documents.find((d) => d.slug === urlSlug);
      if (!doc) {
        doc = documents[0];
      }
    } else {
      doc = documents.find((d) => d.slug === persisted.selectedSlug) ?? documents[0];
    }

    if (doc) {
      setSelectedDoc(doc);
      setCollapsedCategories(new Set(persisted.collapsedCategories));
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', buildDocPath(doc.slug));
      }
      if (typeof window !== 'undefined' && window.location.hash?.length > 1) {
        pendingHash.current = decodeURIComponent(window.location.hash.slice(1));
      }
    }
    setSelectionReady(true);
  }, [documents, selectionReady, urlSlug, loadingList]);

  const loadDocument = useCallback(async (slug: string) => {
    didRestoreScroll.current = false;
    setLoadingDoc(true);
    setToc([]);
    setActiveId('');
    try {
      const response = await fetch(`/api/interview/docs/${slug}`);
      if (response.ok) {
        const data = await response.json();
        const fixedContent = data.contentHtml.replace(
          /href="#([^"]+)"/g,
          (_match: string, encodedId: string) => {
            const decodedId = decodeURIComponent(encodedId);
            return `href="#${decodedId}"`;
          }
        );
        setContent(fixedContent);
      }
    } catch {
      console.error('Failed to load document');
    }
    setLoadingDoc(false);
    didRestoreScroll.current = false;
  }, []);

  useEffect(() => {
    if (!selectedDoc) return;
    loadDocument(selectedDoc.slug);
  }, [selectedDoc, loadDocument]);

  const extractToc = useCallback(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    const items: TocItem[] = [];
    headings.forEach((heading) => {
      const id = heading.id;
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName[1], 10);
      if (id && text) {
        items.push({ id, text, level });
      }
    });

    setToc(items);

    const persisted = loadInterviewState();
    const hashId = pendingHash.current;
    if (hashId && items.some((i) => i.id === hashId)) {
      setActiveId(hashId);
      activeIdRef.current = hashId;
    } else if (
      selectedDoc &&
      persisted.selectedSlug === selectedDoc.slug &&
      persisted.activeHeadingId &&
      items.some((i) => i.id === persisted.activeHeadingId)
    ) {
      setActiveId(persisted.activeHeadingId);
      activeIdRef.current = persisted.activeHeadingId;
    } else if (items.length > 0) {
      setActiveId(items[0].id);
      activeIdRef.current = items[0].id;
    }
  }, [content, selectedDoc]);

  useEffect(() => {
    if (content) {
      extractToc();
    }
  }, [content, extractToc]);

  /** Restore scroll / hash after content + layout */
  useEffect(() => {
    if (!content || loadingDoc || !mainRef.current || didRestoreScroll.current) return;
    const el = mainRef.current;
    const persisted = loadInterviewState();
    const sameDoc = selectedDoc && persisted.selectedSlug === selectedDoc.slug;
    const targetTop = sameDoc ? persisted.scrollTop : 0;

    const apply = () => {
      if (pendingHash.current) {
        const id = pendingHash.current;
        pendingHash.current = null;
        const heading = document.getElementById(id);
        if (heading) {
          el.scrollTop = Math.max(0, heading.offsetTop - 80);
        }
        setActiveId(id);
        activeIdRef.current = id;
      } else {
        el.scrollTop = Math.min(targetTop, Math.max(0, el.scrollHeight - el.clientHeight));
      }
      didRestoreScroll.current = true;
    };
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }, [content, loadingDoc, selectedDoc]);

  const scheduleScrollPersist = useCallback(() => {
    const main = mainRef.current;
    if (!main || !selectedDoc) return;
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
    scrollSaveTimer.current = setTimeout(() => {
      saveInterviewState({
        scrollTop: main.scrollTop,
        activeHeadingId: activeIdRef.current,
        selectedSlug: selectedDoc.slug,
      });
    }, SCROLL_SAVE_MS);
  }, [selectedDoc]);

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      const headings = articleRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (!headings) return;

      let currentActive = '';
      const scrollTop = mainElement.scrollTop + 100;

      headings.forEach((heading) => {
        const top = (heading as HTMLElement).offsetTop;
        if (top <= scrollTop) {
          currentActive = heading.id;
        }
      });

      if (currentActive && currentActive !== activeIdRef.current) {
        setActiveId(currentActive);
        activeIdRef.current = currentActive;
      }
      scheduleScrollPersist();
    };

    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      mainElement.removeEventListener('scroll', handleScroll);
    };
  }, [content, scheduleScrollPersist]);

  useEffect(() => {
    return () => {
      if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
    };
  }, []);

  function scrollToHeading(id: string, smooth = true) {
    const element = document.getElementById(id);
    if (element && mainRef.current && selectedDoc) {
      const mainElement = mainRef.current;
      const top = element.offsetTop - 80;
      mainElement.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
      setActiveId(id);
      activeIdRef.current = id;
      if (typeof window !== 'undefined') {
        const path = `${buildDocPath(selectedDoc.slug)}#${encodeURIComponent(id)}`;
        window.history.replaceState(null, '', path);
      }
      saveInterviewState({
        activeHeadingId: id,
        scrollTop: top,
        selectedSlug: selectedDoc.slug,
      });
    }
  }

  function handleSelectDoc(doc: Document) {
    didRestoreScroll.current = false;
    pendingHash.current = null;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', buildDocPath(doc.slug));
    }
    setSelectedDoc(doc);
    saveInterviewState({
      selectedSlug: doc.slug,
      scrollTop: 0,
      activeHeadingId: '',
      collapsedCategories: Array.from(collapsedCategories),
    });
  }

  function getDocumentsByCategory(category: string) {
    return documents.filter((d) => d.category === category);
  }

  function toggleCategory(category: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      saveInterviewState({
        collapsedCategories: Array.from(next),
        selectedSlug: selectedDoc?.slug ?? null,
      });
      return next;
    });
  }

  const loading = loadingList || !selectionReady || (selectionReady && documents.length > 0 && !selectedDoc);

  if (!loadingList && documents.length === 0) {
    return (
      <main className={shellClass}>
        <div className="ambient" aria-hidden />
        <AtlasRouteSwitch title="面试知识库" />
        <section className="content-shell">
          <div className="content-body">
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center" style={{ color: 'var(--muted)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>
                未找到文档
              </p>
              <p className="text-xs max-w-md">
                请在 <code className="text-[var(--c-neon)]">public/md</code> 目录下添加 Markdown 文件后刷新页面。
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (loading && documents.length === 0) {
    return (
      <main className={shellClass}>
        <div className="ambient" aria-hidden />
        <AtlasRouteSwitch title="面试知识库" />
        <section className="content-shell">
          <div className="content-body">
            <div className="flex items-center justify-center py-20">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: 'var(--c-neon)' }}
              />
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={shellClass}>
      <div className="ambient" aria-hidden />
      <AtlasRouteSwitch title="面试知识库" />
      <section className="content-shell">
        <div className="content-body">
          <div className="content-scroll px-1 py-1">
            <div className="flex gap-4 h-full" style={{ minHeight: 'calc(100vh - 180px)' }}>
              <aside
                className="w-64 flex-shrink-0 rounded-xl overflow-hidden"
                style={{ background: 'var(--card)', border: '1px solid var(--line)' }}
              >
                <div className="p-4 border-b" style={{ borderColor: 'var(--line)' }}>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    文档列表
                  </h2>
                </div>
                <nav className="p-2 max-h-[calc(100vh-240px)] overflow-y-auto">
                  {categories.map((category) => {
                    const isCollapsed = collapsedCategories.has(category);
                    return (
                      <div key={category} className="mb-2">
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                          style={{ color: 'var(--text)', background: 'transparent' }}
                        >
                          <span className="truncate">{category}</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {!isCollapsed && (
                          <ul className="mt-1 ml-2 space-y-1 border-l pl-2" style={{ borderColor: 'var(--line)' }}>
                            {getDocumentsByCategory(category).map((doc) => (
                              <li key={doc.slug}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectDoc(doc)}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors truncate"
                                  style={{
                                    color: selectedDoc?.slug === doc.slug ? 'var(--c-neon)' : 'var(--muted)',
                                    background:
                                      selectedDoc?.slug === doc.slug ? 'rgba(99, 243, 255, 0.1)' : 'transparent',
                                  }}
                                >
                                  {doc.title}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </aside>

              <main
                ref={mainRef}
                className="flex-1 rounded-xl overflow-y-auto"
                style={{ background: 'var(--card)', border: '1px solid var(--line)' }}
              >
                <div className="p-6 lg:p-8">
                  <div className="content-doc-wrapper">
                    {loadingDoc ? (
                      <div className="flex items-center justify-center py-20">
                        <div
                          className="animate-spin rounded-full h-12 w-12 border-b-2"
                          style={{ borderColor: 'var(--c-neon)' }}
                        />
                      </div>
                    ) : (
                      <article ref={articleRef} className="cases-markdown" dangerouslySetInnerHTML={{ __html: content }} />
                    )}
                  </div>
                </div>
              </main>

              {toc.length > 0 && (
                <aside
                  className="hidden xl:block w-56 flex-shrink-0 rounded-xl overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--line)' }}
                >
                  <div className="p-4 border-b" style={{ borderColor: 'var(--line)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      目录
                    </div>
                  </div>
                  <nav className="p-2 max-h-[calc(100vh-240px)] overflow-y-auto">
                    {toc.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => scrollToHeading(item.id)}
                        className="block w-full text-left text-sm py-1.5 px-2 rounded transition-colors truncate"
                        style={{
                          color: activeId === item.id ? 'var(--c-neon)' : 'var(--muted)',
                          background: activeId === item.id ? 'rgba(99, 243, 255, 0.1)' : 'transparent',
                          paddingLeft: `${(item.level - 1) * 12 + 8}px`,
                        }}
                      >
                        {item.text}
                      </button>
                    ))}
                  </nav>
                </aside>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
