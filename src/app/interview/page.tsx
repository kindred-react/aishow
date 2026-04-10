/* eslint-disable */
'use client';

import { useState, useEffect, useRef } from 'react';
import { AtlasRouteSwitch } from '@/components/shared/AtlasRouteSwitch';

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

export default function InterviewPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // eslint-disable-next-line react-hooks/calling-set-state-synchronously-in-effects
  useEffect(() => {
    if (!content) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    const items: TocItem[] = [];
    headings.forEach((heading) => {
      const id = heading.id;
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName[1]);
      if (id && text) {
        items.push({ id, text, level });
      }
    });

    setToc(items);
    if (items.length > 0) {
      setActiveId(items[0].id);
    }
  }, [content]);

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

      if (currentActive && currentActive !== activeId) {
        setActiveId(currentActive);
      }
    };

    mainElement.addEventListener('scroll', handleScroll);
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, [activeId]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const response = await fetch('/api/interview/docs/list');
        if (response.ok && isMounted) {
          const data = await response.json();
          setDocuments(data.documents);
          setCategories(data.categories);

          if (data.documents.length > 0 && isMounted) {
            const firstDoc = data.documents[0];
            setSelectedDoc(firstDoc);

            const docResponse = await fetch(`/api/interview/docs/${firstDoc.slug}`);
            if (docResponse.ok && isMounted) {
              const docData = await docResponse.json();
              setContent(docData.contentHtml);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch:', err);
      }
      if (isMounted) {
        setLoading(false);
      }
    }

    init();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedDoc) return;
    let isMounted = true;

    async function loadDoc() {
      setLoading(true);
      setToc([]);
      setActiveId('');
      try {
        const response = await fetch(`/api/interview/docs/${selectedDoc!.slug}`);
        if (response.ok && isMounted) {
          const data = await response.json();
          setContent(data.contentHtml);
        }
      } catch (err) {
        console.error('Failed to load doc:', err);
      }
      if (isMounted) {
        setLoading(false);
      }
    }

    loadDoc();
    return () => { isMounted = false; };
  }, [selectedDoc]);

  function scrollToHeading(id: string) {
    const element = document.getElementById(id);
    if (element && mainRef.current) {
      const mainElement = mainRef.current;
      const top = element.offsetTop - 80;
      mainElement.scrollTo({ top, behavior: 'smooth' });
      setActiveId(id);
    }
  }

  function handleSelectDoc(doc: Document) {
    setSelectedDoc(doc);
  }

  function getDocumentsByCategory(category: string) {
    return documents.filter(doc => doc.category === category);
  }

  function toggleCategory(category: string) {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  }

  if (loading && documents.length === 0) {
    return (
      <main className={`page-shell${isMounted ? " mounted" : ""}`}>
        <div className="ambient" aria-hidden />
        <AtlasRouteSwitch title="面试知识库" />
        <section className="content-shell">
          <div className="content-body">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--c-neon)' }}></div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`page-shell${isMounted ? " mounted" : ""}`}>
      <div className="ambient" aria-hidden />
      <AtlasRouteSwitch title="面试知识库" />
      <section className="content-shell">
        <div className="content-body">
          <div className="content-scroll px-1 py-1">
            <div className="flex gap-4 h-full" style={{ minHeight: 'calc(100vh - 180px)' }}>
              <aside className="w-64 flex-shrink-0 rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                <div className="p-4 border-b" style={{ borderColor: 'var(--line)' }}>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>文档列表</h2>
                </div>
                <nav className="p-2 max-h-[calc(100vh-240px)] overflow-y-auto">
                  {categories.map(category => {
                    const isCollapsed = collapsedCategories.has(category);
                    return (
                      <div key={category} className="mb-2">
                        <button
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
                            {getDocumentsByCategory(category).map(doc => (
                              <li key={doc.slug}>
                                <button
                                  onClick={() => handleSelectDoc(doc)}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors truncate"
                                  style={{
                                    color: selectedDoc?.slug === doc.slug ? 'var(--c-neon)' : 'var(--muted)',
                                    background: selectedDoc?.slug === doc.slug ? 'rgba(99, 243, 255, 0.1)' : 'transparent',
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

              <main ref={mainRef} className="flex-1 rounded-xl overflow-y-auto" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                <div className="p-6 lg:p-8">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--c-neon)' }}></div>
                    </div>
                  ) : (
                    <article ref={articleRef} className="cases-markdown" dangerouslySetInnerHTML={{ __html: content }} />
                  )}
                </div>
              </main>

              {toc.length > 0 && (
                <aside className="hidden xl:block w-56 flex-shrink-0 rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                  <div className="p-4 border-b" style={{ borderColor: 'var(--line)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      目录
                    </div>
                  </div>
                  <nav className="p-2 max-h-[calc(100vh-240px)] overflow-y-auto">
                    {toc.map((item) => (
                      <button
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
