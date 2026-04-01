"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Code2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { agentFrameworks, agentFrameworkCompareRows } from "@/data/agentFrameworks";
import { useI18n } from "@/lib/i18n";

export function AgentFrameworkCompare() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const [activeId, setActiveId] = useState("openai-sdk");

  const active = agentFrameworks.find(f => f.id === activeId) ?? agentFrameworks[0];

  return (
    <div className="afc-root">
      <div className="apc-table-header" onClick={() => setExpanded(v => !v)}>
        <span>{t.compareFrameworkTitle}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="afc-content"
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
                    {agentFrameworks.map(f => (
                      <th key={f.id} style={{ color: f.color }}>
                        {f.name}
                        <span className="apc-th-en">{f.org}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agentFrameworkCompareRows.map(row => (
                    <tr key={row.key}>
                      <td className="apc-row-label">{row.label}</td>
                      {agentFrameworks.map(f => (
                        <td key={f.id}>{f[row.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="afc-tabs">
              {agentFrameworks.map(f => (
                <button
                  key={f.id}
                  type="button"
                  className={`afc-tab ${activeId === f.id ? "afc-tab-active" : ""}`}
                  style={{ borderColor: activeId === f.id ? f.color : "transparent", color: activeId === f.id ? f.color : undefined }}
                  onClick={() => setActiveId(f.id)}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                className="afc-panel"
                style={{ borderColor: active.color, background: active.accent }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div className="afc-panel-header">
                  <div>
                    <strong style={{ color: active.color }}>{active.name}</strong>
                    <span className="afc-tag">{active.tag}</span>
                  </div>
                  <div className="afc-meta">
                    <span>{active.complexity}</span>
                    <span className="afc-mcp-mode"><Code2 size={11} /> {active.mcpMode}</span>
                  </div>
                </div>
                <div className="afc-body">
                  <ul className="apc-key-points">
                    {active.keyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                  </ul>
                  <div className="afc-code-wrap">
                    <div className="afc-code-label">{t.compareCodeLabel}</div>
                    <SyntaxHighlighter
                      language="python"
                      style={oneDark}
                      customStyle={{ fontSize: "0.72rem", borderRadius: "7px", margin: 0, maxHeight: "320px" }}
                      showLineNumbers
                    >
                      {active.code}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
