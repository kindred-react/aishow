"use client";
import { useState, useMemo } from "react";
import { PenLine, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { InterviewQuestion } from "@/data/types";

export function InterviewPanel({
  questions,
  isEditMode,
  onEdit,
  onDelete,
}: {
  questions: InterviewQuestion[];
  isEditMode?: boolean;
  onEdit?: (q: InterviewQuestion) => void;
  onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();

  const DIFFICULTIES = useMemo(() =>
    [t.interviewDiffAll, t.interviewDiffBeginner, t.interviewDiffIntermediate, t.interviewDiffAdvanced] as const,
    [t.interviewDiffAll, t.interviewDiffBeginner, t.interviewDiffIntermediate, t.interviewDiffAdvanced]
  );

  const categories = useMemo(() => [
    t.interviewDiffAll,
    ...Array.from(new Set(questions.map((q) => q.category))),
  ], [questions, t.interviewDiffAll]);

  const [cat, setCat] = useState(t.interviewDiffAll);
  const [diff, setDiff] = useState(t.interviewDiffAll);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (cat !== t.interviewDiffAll && q.category !== cat) return false;
      if (diff !== t.interviewDiffAll && q.difficulty !== diff) return false;
      if (search && !q.question.includes(search) && !q.keyPoints.join("").includes(search)) return false;
      return true;
    });
  }, [questions, cat, diff, search, t.interviewDiffAll]);

  return (
    <div className="interview-panel">
      <div className="interview-filters">
        <input
          className="interview-search"
          placeholder={t.interviewSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="interview-filter-row">
          <span className="filter-label">{t.interviewFilterCat}</span>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`sub-filter-btn ${cat === c ? "active" : ""}`}
              onClick={() => setCat(c)}
            >{c}</button>
          ))}
        </div>
        <div className="interview-filter-row">
          <span className="filter-label">{t.interviewFilterDiff}</span>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className={`sub-filter-btn ${diff === d ? "active" : ""}`}
              onClick={() => setDiff(d)}
            >{d}</button>
          ))}
        </div>
        <div className="interview-count">
          {t.interviewTotal(filtered.length)}
          {(cat !== t.interviewDiffAll || diff !== t.interviewDiffAll || search) && t.interviewFiltered(filtered.length, questions.length)}
        </div>
      </div>

      <div className="interview-grid">
        {filtered.map((q, idx) => (
          <article key={q.id} id={`item-${q.id}`} className="interview-card">
            <div className="interview-header">
              <span className="interview-idx">Q{idx + 1}</span>
              <span className="interview-cat">{q.category}</span>
              <span className={`interview-diff diff-${q.difficulty}`}>{q.difficulty}</span>
              {isEditMode && (
                <div className="card-edit-btns" style={{ marginLeft: "auto" }}>
                  <button type="button" className="cb-action-btn" onClick={() => onEdit?.(q)}><PenLine size={11}/></button>
                  <button type="button" className="cb-action-btn cb-action-delete" onClick={() => { if(confirm(t.deleteInterviewQ)) onDelete?.(q.id); }}><Trash2 size={11}/></button>
                </div>
              )}
            </div>
            <h4 className="interview-q">{q.question}</h4>
            <div className="interview-framework">{t.interviewFrameworkLabel}{q.framework}</div>
            <ul className="interview-kps">
              {q.keyPoints.map((kp) => <li key={kp}>{kp}</li>)}
            </ul>
            <details className="interview-answer">
              <summary>{t.interviewViewAnswer}</summary>
              <p>{q.sampleAnswer}</p>
              {q.pitfall && <p className="interview-pitfall">{t.interviewPitfallLabel}{q.pitfall}</p>}
            </details>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="empty-hint">{t.interviewNoResult}</p>
        )}
      </div>
    </div>
  );
}
