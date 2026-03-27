"use client";
import { useState, useMemo } from "react";
import type { InterviewQuestion } from "@/data/types";

const DIFFICULTIES = ["全部", "初级", "中级", "高级"] as const;

export function InterviewPanel({ questions }: { questions: InterviewQuestion[] }) {
  const categories = useMemo(() => [
    "全部",
    ...Array.from(new Set(questions.map((q) => q.category))),
  ], [questions]);

  const [cat, setCat] = useState("全部");
  const [diff, setDiff] = useState("全部");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (cat !== "全部" && q.category !== cat) return false;
      if (diff !== "全部" && q.difficulty !== diff) return false;
      if (search && !q.question.includes(search) && !q.keyPoints.join("").includes(search)) return false;
      return true;
    });
  }, [questions, cat, diff, search]);

  return (
    <div className="interview-panel">
      <div className="interview-filters">
        <input
          className="interview-search"
          placeholder="搜索题目关键词…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="interview-filter-row">
          <span className="filter-label">分类</span>
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
          <span className="filter-label">难度</span>
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
          共 <strong>{filtered.length}</strong> 题
          {(cat !== "全部" || diff !== "全部" || search) && ` (筛选自 ${questions.length} 题)`}
        </div>
      </div>

      <div className="interview-grid">
        {filtered.map((q, idx) => (
          <article key={q.id} id={`item-${q.id}`} className="interview-card">
            <div className="interview-header">
              <span className="interview-idx">Q{idx + 1}</span>
              <span className="interview-cat">{q.category}</span>
              <span className={`interview-diff diff-${q.difficulty}`}>{q.difficulty}</span>
            </div>
            <h4 className="interview-q">{q.question}</h4>
            <div className="interview-framework">答题框架：{q.framework}</div>
            <ul className="interview-kps">
              {q.keyPoints.map((kp) => <li key={kp}>{kp}</li>)}
            </ul>
            <details className="interview-answer">
              <summary>查看参考答案</summary>
              <p>{q.sampleAnswer}</p>
              {q.pitfall && <p className="interview-pitfall">⚠️ 常见坑：{q.pitfall}</p>}
            </details>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="empty-hint">没有符合条件的题目，试试调整筛选条件</p>
        )}
      </div>
    </div>
  );
}
