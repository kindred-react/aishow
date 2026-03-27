"use client";
import { useState, useEffect, useRef } from "react";
import { X, Save, Trash2, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type {
  OperationStep, CaseStudy, SkillItem,
  LearningPathNode, InterviewQuestion, CareerMilestone, ToolItem,
  KnowledgeLevel,
} from "@/data/types";

function genId(prefix = "item") {
  return prefix + "-" + Math.random().toString(36).slice(2, 8);
}

type T = ReturnType<typeof useI18n>["t"];

function ListEditor({ label, items, onChange, placeholder, t }: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  t: T;
}) {
  return (
    <div className="note-field">
      <div className="note-label-row">
        <label className="note-label">{label}</label>
        <button type="button" className="note-add-point" onClick={() => onChange([...items, ""])} ><Plus size={12}/> {t.fieldAdd}</button>
      </div>
      <ul className="note-points-list">
        {items.map((v, i) => (
          <li key={i} className="note-point-item">
            <input className="note-input" value={v} placeholder={placeholder ?? t.fieldItemN(i + 1)}
              onChange={e => { const a = [...items]; a[i] = e.target.value; onChange(a); }} />
            <button type="button" className="note-remove-point" onClick={() => onChange(items.filter((_,j) => j!==i))} ><X size={11}/></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────
// OperationStep editor
// ─────────────────────────────────────────────
function OperationForm({ init, onSave, t }: { init: OperationStep | null; onSave: (v: OperationStep) => void; t: T }) {
  const [title, setTitle] = useState(init?.title ?? "");
  const [target, setTarget] = useState(init?.target ?? "");
  const [detail, setDetail] = useState(init?.detail ?? "");
  const [tools, setTools] = useState<string[]>(init?.tools ?? [""]);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);
  const save = () => {
    if (!title.trim()) { ref.current?.focus(); return; }
    onSave({ id: init?.id ?? genId("op"), title: title.trim(), target: target.trim(), detail: detail.trim(), tools: tools.filter(Boolean) });
  };
  return (
    <>
      <div className="note-field"><label className="note-label">{t.opTitle} *</label><input ref={ref} className="note-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={t.opTitlePh} /></div>
      <div className="note-field"><label className="note-label">{t.opTarget}</label><input className="note-input" value={target} onChange={e => setTarget(e.target.value)} placeholder={t.opTargetPh} /></div>
      <div className="note-field"><label className="note-label">{t.opDetail}</label><textarea className="note-textarea" value={detail} onChange={e => setDetail(e.target.value)} rows={3} placeholder={t.opDetailPh} /></div>
      <ListEditor label={t.opTools} items={tools} onChange={setTools} placeholder={t.opToolPh} t={t} />
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> {t.saveChanges}</button>
    </>
  );
}

// ─────────────────────────────────────────────
// CaseStudy editor
// ─────────────────────────────────────────────
function CaseForm({ init, onSave, t }: { init: CaseStudy | null; onSave: (v: CaseStudy) => void; t: T }) {
  const [title, setTitle] = useState(init?.title ?? "");
  const [scene, setScene] = useState(init?.scene ?? "");
  const [problem, setProblem] = useState(init?.problem ?? "");
  const [solution, setSolution] = useState(init?.solution ?? "");
  const [result, setResult] = useState(init?.result ?? "");
  const [tags, setTags] = useState<string[]>(init?.tags ?? [""]);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);
  const save = () => {
    if (!title.trim()) { ref.current?.focus(); return; }
    onSave({ id: init?.id ?? genId("case"), title: title.trim(), scene: scene.trim(), problem: problem.trim(), solution: solution.trim(), result: result.trim(), tags: tags.filter(Boolean) });
  };
  return (
    <>
      <div className="note-field"><label className="note-label">{t.caseTitle} *</label><input ref={ref} className="note-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={t.caseTitlePh} /></div>
      <div className="note-field"><label className="note-label">{t.caseScene}</label><input className="note-input" value={scene} onChange={e => setScene(e.target.value)} placeholder={t.caseScenePh} /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
        <div className="note-field"><label className="note-label">{t.caseProblem}</label><textarea className="note-textarea" value={problem} onChange={e => setProblem(e.target.value)} rows={2} placeholder={t.caseProblemPh} /></div>
        <div className="note-field"><label className="note-label">{t.caseSolution}</label><textarea className="note-textarea" value={solution} onChange={e => setSolution(e.target.value)} rows={2} placeholder={t.caseSolutionPh} /></div>
      </div>
      <div className="note-field"><label className="note-label">{t.caseResult}</label><input className="note-input" value={result} onChange={e => setResult(e.target.value)} placeholder={t.caseResultPh} /></div>
      <ListEditor label={t.caseTags} items={tags} onChange={setTags} placeholder={t.caseTagPh} t={t} />
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> {t.saveChanges}</button>
    </>
  );
}

// ─────────────────────────────────────────────
// SkillItem editor
// ─────────────────────────────────────────────
const SKILL_LEVELS = [1,2,3,4,5] as const;
function SkillForm({ init, onSave, t }: { init: SkillItem | null; onSave: (v: SkillItem) => void; t: T }) {
  const [name, setName] = useState(init?.name ?? "");
  const [dimension, setDimension] = useState(init?.dimension ?? "");
  const [level, setLevel] = useState<1|2|3|4|5>(init?.level ?? 3);
  const [description, setDescription] = useState(init?.description ?? "");
  const [howTo, setHowTo] = useState<string[]>(init?.howTo ?? [""]);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);
  const save = () => {
    if (!name.trim()) { ref.current?.focus(); return; }
    onSave({ id: init?.id ?? genId("skill"), name: name.trim(), dimension: dimension.trim(), level, description: description.trim(), howTo: howTo.filter(Boolean) });
  };
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
        <div className="note-field"><label className="note-label">{t.skillName} *</label><input ref={ref} className="note-input" value={name} onChange={e => setName(e.target.value)} placeholder={t.skillNamePh} /></div>
        <div className="note-field"><label className="note-label">{t.skillDimension}</label><input className="note-input" value={dimension} onChange={e => setDimension(e.target.value)} placeholder={t.skillDimensionPh} /></div>
      </div>
      <div className="note-field">
        <label className="note-label">{t.skillLevel}</label>
        <div className="node-level-btns">
          {SKILL_LEVELS.map(l => (
            <button key={l} type="button" className={`node-level-btn ${level===l?"active":""}`} onClick={()=>setLevel(l)}>{"★".repeat(l)}</button>
          ))}
        </div>
      </div>
      <div className="note-field"><label className="note-label">{t.skillDesc}</label><textarea className="note-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder={t.skillDescPh} /></div>
      <ListEditor label={t.skillHowTo} items={howTo} onChange={setHowTo} placeholder={t.skillHowToPh} t={t} />
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> {t.saveChanges}</button>
    </>
  );
}

// ─────────────────────────────────────────────
// LearningPathNode editor
// ─────────────────────────────────────────────
const PATH_LEVELS: KnowledgeLevel[] = ["基础","进阶","实战"];
function PathForm({ init, onSave, t }: { init: LearningPathNode | null; onSave: (v: LearningPathNode) => void; t: T }) {
  const [title, setTitle] = useState(init?.title ?? "");
  const [level, setLevel] = useState<KnowledgeLevel>(init?.level ?? "基础");
  const [hours, setHours] = useState(String(init?.estimatedHours ?? ""));
  const [tip, setTip] = useState(init?.tip ?? "");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);
  const save = () => {
    if (!title.trim()) { ref.current?.focus(); return; }
    onSave({ id: init?.id ?? genId("path"), title: title.trim(), level, estimatedHours: hours ? Number(hours) : undefined, tip: tip.trim() || undefined });
  };
  return (
    <>
      <div className="note-field"><label className="note-label">{t.pathTitle} *</label><input ref={ref} className="note-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={t.pathTitlePh} /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
        <div className="note-field">
          <label className="note-label">{t.pathDifficulty}</label>
          <div className="node-level-btns">{PATH_LEVELS.map(l => <button key={l} type="button" className={`node-level-btn ${level===l?"active":""}`} onClick={()=>setLevel(l)}>{l}</button>)}</div>
        </div>
        <div className="note-field"><label className="note-label">{t.pathHours}</label><input className="note-input" type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder={t.pathHoursPh} /></div>
      </div>
      <div className="note-field"><label className="note-label">{t.pathTip}</label><input className="note-input" value={tip} onChange={e => setTip(e.target.value)} placeholder={t.pathTipPh} /></div>
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> {t.saveChanges}</button>
    </>
  );
}

// ─────────────────────────────────────────────
// InterviewQuestion editor
// ─────────────────────────────────────────────
const IQ_DIFFICULTIES = ["初级","中级","高级"] as const;
const IQ_CATEGORIES = ["技术理解","产品设计","商业判断","行为面试"];
function InterviewForm({ init, onSave, t }: { init: InterviewQuestion | null; onSave: (v: InterviewQuestion) => void; t: T }) {
  const [question, setQuestion] = useState(init?.question ?? "");
  const [category, setCategory] = useState(init?.category ?? IQ_CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<"初级"|"中级"|"高级">(init?.difficulty ?? "初级");
  const [framework, setFramework] = useState(init?.framework ?? "");
  const [keyPoints, setKeyPoints] = useState<string[]>(init?.keyPoints ?? [""]);
  const [sampleAnswer, setSampleAnswer] = useState(init?.sampleAnswer ?? "");
  const [pitfall, setPitfall] = useState(init?.pitfall ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);
  const save = () => {
    if (!question.trim()) { ref.current?.focus(); return; }
    onSave({ id: init?.id ?? genId("iq"), question: question.trim(), category, difficulty, framework: framework.trim(), keyPoints: keyPoints.filter(Boolean), sampleAnswer: sampleAnswer.trim(), pitfall: pitfall.trim() || undefined });
  };
  return (
    <>
      <div className="note-field"><label className="note-label">{t.iqQuestion} *</label><textarea ref={ref} className="note-textarea" value={question} onChange={e => setQuestion(e.target.value)} rows={2} placeholder={t.iqQuestionPh} /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
        <div className="note-field">
          <label className="note-label">{t.iqCategory}</label>
          <div className="node-level-btns" style={{flexWrap:"wrap"}}>{IQ_CATEGORIES.map(c => <button key={c} type="button" className={`node-level-btn ${category===c?"active":""}`} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        </div>
        <div className="note-field">
          <label className="note-label">{t.iqDifficulty}</label>
          <div className="node-level-btns">{IQ_DIFFICULTIES.map(d => <button key={d} type="button" className={`node-level-btn ${difficulty===d?"active":""}`} onClick={()=>setDifficulty(d)}>{d}</button>)}</div>
        </div>
      </div>
      <div className="note-field"><label className="note-label">{t.iqFramework}</label><input className="note-input" value={framework} onChange={e => setFramework(e.target.value)} placeholder={t.iqFrameworkPh} /></div>
      <ListEditor label={t.iqKeyPoints} items={keyPoints} onChange={setKeyPoints} placeholder={t.iqKeyPointPh} t={t} />
      <div className="note-field"><label className="note-label">{t.iqSampleAnswer}</label><textarea className="note-textarea" value={sampleAnswer} onChange={e => setSampleAnswer(e.target.value)} rows={3} placeholder={t.iqSampleAnswerPh} /></div>
      <div className="note-field"><label className="note-label">{t.iqPitfall}</label><input className="note-input" value={pitfall} onChange={e => setPitfall(e.target.value)} placeholder={t.iqPitfallPh} /></div>
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> {t.saveChanges}</button>
    </>
  );
}

// ─────────────────────────────────────────────
// CareerMilestone editor
// ─────────────────────────────────────────────
function CareerForm({ init, onSave, t }: { init: CareerMilestone | null; onSave: (v: CareerMilestone) => void; t: T }) {
  const [week, setWeek] = useState(init?.week ?? "");
  const [phase, setPhase] = useState(init?.phase ?? "");
  const [goal, setGoal] = useState(init?.goal ?? "");
  const [actions, setActions] = useState<string[]>(init?.actions ?? [""]);
  const [deliverable, setDeliverable] = useState(init?.deliverable ?? "");
  const [resources, setResources] = useState<string[]>(init?.resources ?? [""]);
  const [checkPoint, setCheckPoint] = useState(init?.checkPoint ?? "");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);
  const save = () => {
    if (!week.trim()) { ref.current?.focus(); return; }
    onSave({ id: init?.id ?? genId("career"), week: week.trim(), phase: phase.trim(), goal: goal.trim(), actions: actions.filter(Boolean), deliverable: deliverable.trim(), resources: resources.filter(Boolean), checkPoint: checkPoint.trim() });
  };
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
        <div className="note-field"><label className="note-label">{t.careerWeek} *</label><input ref={ref} className="note-input" value={week} onChange={e => setWeek(e.target.value)} placeholder={t.careerWeekPh} /></div>
        <div className="note-field"><label className="note-label">{t.careerPhase}</label><input className="note-input" value={phase} onChange={e => setPhase(e.target.value)} placeholder={t.careerPhasePh} /></div>
      </div>
      <div className="note-field"><label className="note-label">{t.careerGoal}</label><input className="note-input" value={goal} onChange={e => setGoal(e.target.value)} placeholder={t.careerGoalPh} /></div>
      <ListEditor label={t.careerActions} items={actions} onChange={setActions} placeholder={t.careerActionPh} t={t} />
      <div className="note-field"><label className="note-label">{t.careerDeliverable}</label><input className="note-input" value={deliverable} onChange={e => setDeliverable(e.target.value)} placeholder={t.careerDeliverablePh} /></div>
      <ListEditor label={t.careerResources} items={resources} onChange={setResources} placeholder={t.careerResourcePh} t={t} />
      <div className="note-field"><label className="note-label">{t.careerCheckPoint}</label><input className="note-input" value={checkPoint} onChange={e => setCheckPoint(e.target.value)} placeholder={t.careerCheckPointPh} /></div>
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> {t.saveChanges}</button>
    </>
  );
}

// ─────────────────────────────────────────────
// ToolItem editor
// ─────────────────────────────────────────────
const TOOL_CATEGORIES = ["AI写作","AI绘图","AI编程","AI搜索","AI视频","AI音频","开发工具","效率工具","其他"];
const TOOL_CATEGORIES_EN = ["AI Writing","AI Image","AI Coding","AI Search","AI Video","AI Audio","Dev Tools","Productivity","Other"];
function ToolForm({ init, onSave, t }: { init: ToolItem | null; onSave: (v: ToolItem) => void; t: T }) {
  const { locale } = useI18n();
  const isEn = locale === "en";
  const [name, setName] = useState(init?.name ?? "");
  const [category, setCategory] = useState(init?.category ?? TOOL_CATEGORIES[0]);
  const [url, setUrl] = useState(init?.url ?? "");
  const [description, setDescription] = useState(init?.description ?? "");
  const [tags, setTags] = useState<string[]>(init?.tags ?? [""]);
  const [isPaid, setIsPaid] = useState(init?.isPaid ?? false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);
  const save = () => {
    if (!name.trim()) { ref.current?.focus(); return; }
    onSave({ id: init?.id ?? genId("tool"), name: name.trim(), category, url: url.trim() || undefined, description: description.trim(), tags: tags.filter(Boolean), isPaid });
  };
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
        <div className="note-field"><label className="note-label">{t.toolName} *</label><input ref={ref} className="note-input" value={name} onChange={e => setName(e.target.value)} placeholder={t.toolNamePh} /></div>
        <div className="note-field"><label className="note-label">{t.toolUrl}</label><input className="note-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." /></div>
      </div>
      <div className="note-field">
        <label className="note-label">{t.toolCategory}</label>
        <div className="node-level-btns" style={{flexWrap:"wrap"}}>
          {TOOL_CATEGORIES.map((c, i) => <button key={c} type="button" className={`node-level-btn ${category===c?"active":""}`} onClick={()=>setCategory(c)}>{isEn ? TOOL_CATEGORIES_EN[i] : c}</button>)}
        </div>
      </div>
      <div className="note-field"><label className="note-label">{t.toolDesc}</label><textarea className="note-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder={t.toolDescPh} /></div>
      <ListEditor label={t.toolTags} items={tags} onChange={setTags} placeholder={t.toolTagPh} t={t} />
      <div className="note-field">
        <label className="note-label">
          <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} style={{marginRight:"0.4rem"}} />
          {t.toolIsPaid}
        </label>
      </div>
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> {t.saveChanges}</button>
    </>
  );
}

export type TabItemType = "operation" | "cases" | "skills" | "path" | "interview" | "career" | "tools";

const TAB_LABELS_ZH: Record<TabItemType, string> = {
  operation: "操作步骤",
  cases: "案例",
  skills: "技能",
  path: "路径节点",
  interview: "面试题",
  career: "职业规划条目",
  tools: "工具",
};

const TAB_LABELS_EN: Record<TabItemType, string> = {
  operation: "Operation Step",
  cases: "Case Study",
  skills: "Skill",
  path: "Path Node",
  interview: "Interview Q",
  career: "Career Milestone",
  tools: "Tool",
};

type AnyItem = OperationStep | CaseStudy | SkillItem | LearningPathNode | InterviewQuestion | CareerMilestone | ToolItem;

interface TabItemEditorProps {
  tab: TabItemType;
  item: AnyItem | null;
  onSave: (item: AnyItem) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function TabItemEditor({ tab, item, onSave, onDelete, onClose }: TabItemEditorProps) {
  const isNew = item === null;
  const { locale, t } = useI18n();
  const isEn = locale === "en";
  const label = (isEn ? TAB_LABELS_EN : TAB_LABELS_ZH)[tab];

  const handleSave = (saved: AnyItem) => {
    onSave(saved);
    onClose();
  };

  const handleDelete = () => {
    if (!confirm(isEn ? `Delete this ${label}?` : `确定删除这条${label}？`)) return;
    onDelete?.();
    onClose();
  };

  return (
    <div className="note-overlay" onClick={onClose}>
      <div className="note-modal note-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="note-modal-header">
          <span>{isNew ? (isEn ? `Add ${label}` : `新增${label}`) : (isEn ? `Edit: ${label}` : `编辑：${label}`)}</span>
          <div style={{display:"flex",gap:"0.3rem"}}>
            {!isNew && onDelete && (
              <button type="button" className="note-delete-btn" onClick={handleDelete}><Trash2 size={13}/> {t.deleteNode}</button>
            )}
            <button type="button" className="note-close" onClick={onClose}><X size={14}/></button>
          </div>
        </div>
        <div className="note-edit-body">
          {tab === "operation" && <OperationForm init={item as OperationStep | null} onSave={handleSave} t={t} />}
          {tab === "cases"     && <CaseForm      init={item as CaseStudy | null}      onSave={handleSave} t={t} />}
          {tab === "skills"    && <SkillForm     init={item as SkillItem | null}      onSave={handleSave} t={t} />}
          {tab === "path"      && <PathForm      init={item as LearningPathNode | null} onSave={handleSave} t={t} />}
          {tab === "interview" && <InterviewForm init={item as InterviewQuestion | null} onSave={handleSave} t={t} />}
          {tab === "career"    && <CareerForm    init={item as CareerMilestone | null}   onSave={handleSave} t={t} />}
          {tab === "tools"     && <ToolForm      init={item as ToolItem | null}         onSave={handleSave} t={t} />}
        </div>
      </div>
    </div>
  );
} 