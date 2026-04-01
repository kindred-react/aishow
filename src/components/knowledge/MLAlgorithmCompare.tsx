"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, ZoomIn, X } from "lucide-react";
import { mlAlgorithms, mlCompareRows } from "@/data/mlAlgorithms";
import { useI18n } from "@/lib/i18n";

export function MLAlgorithmCompare() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; name: string } | null>(null);

  return (
    <div className="apc-root">
      <div className="apc-table-header" onClick={() => setExpanded(v => !v)}>
        <span>{t.compareMLTitle}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="ml-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="apc-table-wrap">
              <table className="apc-table">
                <thead>
                  <tr>
                    <th>{t.compareDimension}</th>
                    {mlAlgorithms.map(a => (
                      <th key={a.id} className="text-sm" style={{ color: a.color }}>
                        {a.name}
                        <span className="apc-th-en">{a.nameEn}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mlCompareRows.map(row => (
                    <tr key={row.key}>
                      <td className="apc-row-label">{row.label}</td>
                      {mlAlgorithms.map(a => (
                        <td key={a.id}>{a[row.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="apc-cards mt-3" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
              {mlAlgorithms.map((a, i) => (
                <motion.article
                  key={a.id}
                  className="apc-card apc-card-open"
                  style={{ borderColor: a.color, background: a.accent }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <div className="apc-card-header">
                    <div className="apc-card-title">
                      <strong style={{ color: a.color }}>{a.name}</strong>
                      <span className="apc-card-en">{a.nameEn}</span>
                    </div>
                    <span className="apc-complexity">{a.complexity}</span>
                  </div>

                  <div className="apc-flow">
                    {a.flow.map((step, idx) => (
                      <span key={idx} className="apc-flow-step">
                        {step}
                        {idx < a.flow.length - 1 && <span className="apc-flow-arrow">→</span>}
                      </span>
                    ))}
                  </div>

                  <div className="apc-detail">
                    {a.imageUrl && (
                      <button type="button" className="apc-img-btn"
                        onClick={() => setLightboxImg({ src: a.imageUrl!, name: a.name })}
                        title={t.compareZoomTitle}
                      >
                        <img src={a.imageUrl} alt={a.name} className="apc-detail-img" loading="lazy" />
                        <span className="apc-img-hint"><ZoomIn size={12} /> {t.compareZoomIn}</span>
                      </button>
                    )}
                    <ul className="apc-key-points">
                      {a.keyPoints.map((pt, j) => <li key={j}>{pt}</li>)}
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
              onClick={e => e.stopPropagation()}
            >
              <div className="apc-lightbox-header">
                <span>{t.compareAlgoLightbox(lightboxImg.name)}</span>
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
