"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

interface TocItem {
  id: string;
  label: string;
}

interface TocPickerProps {
  items: TocItem[];
  onSelect: (id: string) => void;
  activeId?: string;
}

const ITEM_HEIGHT = 40;

export function TocPicker({ items, onSelect, activeId }: TocPickerProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(7);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const h = el.clientHeight;
      const count = Math.max(3, Math.floor(h / ITEM_HEIGHT));
      setVisibleCount(count % 2 === 0 ? count - 1 : count);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const i = items.findIndex((it) => it.id === activeId);
    if (i >= 0) setActiveIdx(i);
  }, [activeId, items]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: activeIdx * ITEM_HEIGHT, behavior: "smooth" });
  }, [activeIdx, visibleCount]);

  const handleClick = useCallback((idx: number, id: string) => {
    setActiveIdx(idx);
    onSelect(id);
  }, [onSelect]);

  const pad = Math.floor(visibleCount / 2);
  const pickerHeight = visibleCount * ITEM_HEIGHT;
  const paddedItems: (TocItem | null)[] = [
    ...Array(pad).fill(null),
    ...items,
    ...Array(pad).fill(null),
  ];

  return (
    <div ref={containerRef} className="toc-picker-wrap">
      <p className="toc-title" style={{ margin: "0 0 0.4rem", padding: "0 0.5rem" }}>{t.tocTitle}</p>
      <div className="toc-picker" style={{ height: pickerHeight }}>
        <div className="toc-picker-fade toc-picker-fade-top" />
        <div className="toc-picker-fade toc-picker-fade-bottom" />
        <div
          className="toc-picker-bar"
          style={{ top: pad * ITEM_HEIGHT, height: ITEM_HEIGHT }}
        />
        <div ref={listRef} className="toc-picker-list" style={{ height: pickerHeight }}>
          {paddedItems.map((item, i) => {
            if (!item) return <div key={`pad-${i}`} style={{ height: ITEM_HEIGHT, flexShrink: 0 }} />;
            const realIdx = i - pad;
            const dist = Math.abs(realIdx - activeIdx);
            const isActive = realIdx === activeIdx;
            const isNear = dist === 1;
            const opacity = isActive ? 1 : isNear ? 0.6 : dist === 2 ? 0.3 : 0.15;
            const scale = isActive ? 1 : isNear ? 0.92 : 0.84;
            return (
              <button
                key={item.id}
                type="button"
                className={`toc-picker-item${isActive ? " active" : ""}${isNear ? " near" : ""}`}
                style={{ height: ITEM_HEIGHT, opacity, transform: `scale(${scale})`, flexShrink: 0 }}
                title={item.label}
                onClick={() => handleClick(realIdx, item.id)}
              >
                <span className="toc-picker-idx">{realIdx + 1}</span>
                <span className="toc-picker-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
