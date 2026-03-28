"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, X, ChevronUp, ChevronDown } from "lucide-react";
import { agentPatterns, agentPatternCompareRows } from "@/data/agentPatterns";
import { useI18n } from "@/lib/i18n";

export function AgentPatternCompare() {
  const { t } = useI18n();
  const [showAll, setShowAll] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; name: string } | null>(null);

  return (
    <div className="apc-root">
      <div className="apc-table-header" onClick={() => setShowAll(v => !v)}>
        <span>{t.comparePatternTitle}</span>
        {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      <AnimatePresence initial={false}>
        {showAll && (
          <motion.div
            key="all-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            <div className="apc-table-wrap">
              <table className="apc-table">
                <thead>
                  <tr>
                    <th>{t.compareDimension}</th>
                    {agentPatterns.map(p => (
                      <th key={p.id} style={{ color: p.color }}>
                        {p.name}
                        <span className="apc-th-en">{p.nameEn}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agentPatternCompareRows.map(row => (
                    <tr key={row.key}>
                      <td className="apc-row-label">{row.label}</td>
                      {agentPatterns.map(p => (
                        <td key={p.id}>{p[row.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="apc-cards">
              {agentPatterns.map((p, i) => (
                <motion.article
                  key={p.id}
                  className="apc-card apc-card-open"
                  style={{ borderColor: p.color, background: p.accent }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <div className="apc-card-header">
                    <div className="apc-card-title">
                      <span className="apc-card-dot" style={{ background: p.color }} />
                      <strong style={{ color: p.color }}>{p.name}</strong>
                      <span className="apc-card-en">{p.nameEn}</span>
                    </div>
                    <span className="apc-complexity">{p.complexity}</span>
                  </div>
                  <div className="apc-flow">
                    {p.flow.map((step, idx) => (
                      <span key={idx} className="apc-flow-step">
                        {step}
                        {idx < p.flow.length - 1 && <span className="apc-flow-arrow">→</span>}
                      </span>
                    ))}
                  </div>
                  <div className="apc-detail">
                    <button
                      type="button"
                      className="apc-img-btn"
                      onClick={() => setLightboxImg({ src: p.imageUrl, name: p.name })}
                      title={t.compareZoomTitle}
                    >
                      <img src={p.imageUrl} alt={p.name} className="apc-detail-img" loading="lazy" />
                      <span className="apc-img-hint"><ZoomIn size={12} /> {t.compareZoomIn}</span>
                    </button>
                    <ul className="apc-key-points">
                      {p.keyPoints.map((pt, j) => (
                        <li key={j}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            className="apc-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxImg(null)}
          >
            <motion.div
              className="apc-lightbox-inner"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="apc-lightbox-header">
                <span>{t.comparePatternLightbox(lightboxImg.name)}</span>
                <button type="button" className="apc-lightbox-close" onClick={() => setLightboxImg(null)}>
                  <X size={16} />
                </button>
              </div>
              <img src={lightboxImg.src} alt={lightboxImg.name} className="apc-lightbox-img" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
