"use client";
import { useState, useEffect, useRef } from "react";
import { X, Save, Trash2, Plus } from "lucide-react";
import type {
  OperationStep, CaseStudy, SkillItem,
  LearningPathNode, InterviewQuestion, CareerMilestone, ToolItem,
  KnowledgeLevel,
} from "@/data/types";

function genId(prefix = "item") {
  return prefix + "-" + Math.random().toString(36).slice(2, 8);
}

function ListEditor({ label, items, onChange, placeholder }: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="note-field">
      <div className="note-label-row">
        <label className="note-label">{label}</label>
        <button type="button" className="note-add-point" onClick={() => onChange([...items, ""])} ><Plus size={12}/> 添加</button>
      </div>
      <ul className="note-points-list">
        {items.map((v, i) => (
          <li key={i} className="note-point-item">
            <input className="note-input" value={v} placeholder={placeholder ?? `第 ${i+1} 项`}
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
function OperationForm({ init, onSave }: { init: OperationStep | null; onSave: (v: OperationStep) => void }) {
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
      <div className="note-field"><label className="note-label">标题 *</label><input ref={ref} className="note-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="操作步骤标题" /></div>
      <div className="note-field"><label className="note-label">目标</label><input className="note-input" value={target} onChange={e => setTarget(e.target.value)} placeholder="本步骤目标" /></div>
      <div className="note-field"><label className="note-label">详情</label><textarea className="note-textarea" value={detail} onChange={e => setDetail(e.target.value)} rows={3} placeholder="具体操作说明" /></div>
      <ListEditor label="工具" items={tools} onChange={setTools} placeholder="工具名" />
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> 保存</button>
    </>
  );
}

// ─────────────────────────────────────────────
// CaseStudy editor
// ─────────────────────────────────────────────
function CaseForm({ init, onSave }: { init: CaseStudy | null; onSave: (v: CaseStudy) => void }) {
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
      <div className="note-field"><label className="note-label">标题 *</label><input ref={ref} className="note-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="案例标题" /></div>
      <div className="note-field"><label className="note-label">场景</label><input className="note-input" value={scene} onChange={e => setScene(e.target.value)} placeholder="业务场景" /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
        <div className="note-field"><label className="note-label">问题</label><textarea className="note-textarea" value={problem} onChange={e => setProblem(e.target.value)} rows={2} placeholder="遇到的问题" /></div>
        <div className="note-field"><label className="note-label">方案</label><textarea className="note-textarea" value={solution} onChange={e => setSolution(e.target.value)} rows={2} placeholder="解决方案" /></div>
      </div>
      <div className="note-field"><label className="note-label">结果</label><input className="note-input" value={result} onChange={e => setResult(e.target.value)} placeholder="最终结果" /></div>
      <ListEditor label="标签" items={tags} onChange={setTags} placeholder="标签" />
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> 保存</button>
    </>
  );
}

// ─────────────────────────────────────────────
// SkillItem editor
// ─────────────────────────────────────────────
const SKILL_LEVELS = [1,2,3,4,5] as const;
function SkillForm({ init, onSave }: { init: SkillItem | null; onSave: (v: SkillItem) => void }) {
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
        <div className="note-field"><label className="note-label">技能名 *</label><input ref={ref} className="note-input" value={name} onChange={e => setName(e.target.value)} placeholder="技能名称" /></div>
        <div className="note-field"><label className="note-label">维度</label><input className="note-input" value={dimension} onChange={e => setDimension(e.target.value)} placeholder="如：技术深度" /></div>
      </div>
      <div className="note-field">
        <label className="note-label">熟练度</label>
        <div className="node-level-btns">
          {SKILL_LEVELS.map(l => (
            <button key={l} type="button" className={`node-level-btn ${level===l?"active":""}`} onClick={()=>setLevel(l)}>{"★".repeat(l)}</button>
          ))}
        </div>
      </div>
      <div className="note-field"><label className="note-label">描述</label><textarea className="note-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="技能描述" /></div>
      <ListEditor label="提升方法" items={howTo} onChange={setHowTo} placeholder="如：做一个项目" />
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> 保存</button>
    </>
  );
}

// ─────────────────────────────────────────────
// LearningPathNode editor
// ─────────────────────────────────────────────
const PATH_LEVELS: KnowledgeLevel[] = ["基础","进阶","实战"];
function PathForm({ init, onSave }: { init: LearningPathNode | null; onSave: (v: LearningPathNode) => void }) {
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
      <div className="note-field"><label className="note-label">标题 *</label><input ref={ref} className="note-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="路径节点标题" /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
        <div className="note-field">
          <label className="note-label">难度</label>
          <div className="node-level-btns">{PATH_LEVELS.map(l => <button key={l} type="button" className={`node-level-btn ${level===l?"active":""}`} onClick={()=>setLevel(l)}>{l}</button>)}</div>
        </div>
        <div className="note-field"><label className="note-label">预计时长（小时）</label><input className="note-input" type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder="如：4" /></div>
      </div>
      <div className="note-field"><label className="note-label">提示</label><input className="note-input" value={tip} onChange={e => setTip(e.target.value)} placeholder="学习建议" /></div>
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> 保存</button>
    </>
  );
}

// ─────────────────────────────────────────────
// InterviewQuestion editor
// ─────────────────────────────────────────────
const IQ_DIFFICULTIES = ["初级","中级","高级"] as const;
const IQ_CATEGORIES = ["技术理解","产品设计","商业判断","行为面试"];
function InterviewForm({ init, onSave }: { init: InterviewQuestion | null; onSave: (v: InterviewQuestion) => void }) {
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
      <div className="note-field"><label className="note-label">问题 *</label><textarea ref={ref} className="note-textarea" value={question} onChange={e => setQuestion(e.target.value)} rows={2} placeholder="面试题内容" /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
        <div className="note-field">
          <label className="note-label">分类</label>
          <div className="node-level-btns" style={{flexWrap:"wrap"}}>{IQ_CATEGORIES.map(c => <button key={c} type="button" className={`node-level-btn ${category===c?"active":""}`} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        </div>
        <div className="note-field">
          <label className="note-label">难度</label>
          <div className="node-level-btns">{IQ_DIFFICULTIES.map(d => <button key={d} type="button" className={`node-level-btn ${difficulty===d?"active":""}`} onClick={()=>setDifficulty(d)}>{d}</button>)}</div>
        </div>
      </div>
      <div className="note-field"><label className="note-label">答题框架</label><input className="note-input" value={framework} onChange={e => setFramework(e.target.value)} placeholder="一句话答题框架" /></div>
      <ListEditor label="核心要点" items={keyPoints} onChange={setKeyPoints} placeholder="答题要点" />
      <div className="note-field"><label className="note-label">参考答案</label><textarea className="note-textarea" value={sampleAnswer} onChange={e => setSampleAnswer(e.target.value)} rows={3} placeholder="简洁版参考答案" /></div>
      <div className="note-field"><label className="note-label">常见坑</label><input className="note-input" value={pitfall} onChange={e => setPitfall(e.target.value)} placeholder="回答时常见误区" /></div>
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> 保存</button>
    </>
  );
}

// ─────────────────────────────────────────────
// CareerMilestone editor
// ─────────────────────────────────────────────
function CareerForm({ init, onSave }: { init: CareerMilestone | null; onSave: (v: CareerMilestone) => void }) {
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
        <div className="note-field"><label className="note-label">时间段 *</label><input ref={ref} className="note-input" value={week} onChange={e => setWeek(e.target.value)} placeholder="如：第1-2天" /></div>
        <div className="note-field"><label className="note-label">阶段名</label><input className="note-input" value={phase} onChange={e => setPhase(e.target.value)} placeholder="阶段名称" /></div>
      </div>
      <div className="note-field"><label className="note-label">目标</label><input className="note-input" value={goal} onChange={e => setGoal(e.target.value)} placeholder="本阶段目标" /></div>
      <ListEditor label="行动清单" items={actions} onChange={setActions} placeholder="具体行动" />
      <div className="note-field"><label className="note-label">交付物</label><input className="note-input" value={deliverable} onChange={e => setDeliverable(e.target.value)} placeholder="可交付产物" /></div>
      <ListEditor label="推荐资源" items={resources} onChange={setResources} placeholder="资源链接或名称" />
      <div className="note-field"><label className="note-label">验收标准</label><input className="note-input" value={checkPoint} onChange={e => setCheckPoint(e.target.value)} placeholder="如何验证完成了" /></div>
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> 保存</button>
    </>
  );
}

// ─────────────────────────────────────────────
// ToolItem editor
// ─────────────────────────────────────────────
const TOOL_CATEGORIES = ["AI写作","AI绘图","AI编程","AI搜索","AI视频","AI音频","开发工具","效率工具","其他"];
function ToolForm({ init, onSave }: { init: ToolItem | null; onSave: (v: ToolItem) => void }) {
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
        <div className="note-field"><label className="note-label">工具名 *</label><input ref={ref} className="note-input" value={name} onChange={e => setName(e.target.value)} placeholder="如：ChatGPT" /></div>
        <div className="note-field"><label className="note-label">官网链接</label><input className="note-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." /></div>
      </div>
      <div className="note-field">
        <label className="note-label">分类</label>
        <div className="node-level-btns" style={{flexWrap:"wrap"}}>
          {TOOL_CATEGORIES.map(c => <button key={c} type="button" className={`node-level-btn ${category===c?"active":""}`} onClick={()=>setCategory(c)}>{c}</button>)}
        </div>
      </div>
      <div className="note-field"><label className="note-label">描述</label><textarea className="note-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="一句话介绍这个工具" /></div>
      <ListEditor label="标签" items={tags} onChange={setTags} placeholder="如：免费、GPT-4" />
      <div className="note-field">
        <label className="note-label">
          <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} style={{marginRight:"0.4rem"}} />
          付费工具
        </label>
      </div>
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> 保存</button>
    </>
  );
}

export type TabItemType = "operation" | "cases" | "skills" | "path" | "interview" | "career" | "tools";

const TAB_LABELS: Record<TabItemType, string> = {
  operation: "操作步骤",
  cases: "案例",
  skills: "技能",
  path: "路径节点",
  interview: "面试题",
  career: "职业规划条目",
  tools: "工具",
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
  const label = TAB_LABELS[tab];

  const handleSave = (saved: AnyItem) => {
    onSave(saved);
    onClose();
  };

  const handleDelete = () => {
    if (!confirm(`确定删除这条${label}？`)) return;
    onDelete?.();
    onClose();
  };

  return (
    <div className="note-overlay" onClick={onClose}>
      <div className="note-modal note-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="note-modal-header">
          <span>{isNew ? `新增${label}` : `编辑：${label}`}</span>
          <div style={{display:"flex",gap:"0.3rem"}}>
            {!isNew && onDelete && (
              <button type="button" className="note-delete-btn" onClick={handleDelete}><Trash2 size={13}/> 删除</button>
            )}
            <button type="button" className="note-close" onClick={onClose}><X size={14}/></button>
          </div>
        </div>
        <div className="note-edit-body">
          {tab === "operation" && <OperationForm init={item as OperationStep | null} onSave={handleSave} />}
          {tab === "cases"     && <CaseForm      init={item as CaseStudy | null}      onSave={handleSave} />}
          {tab === "skills"    && <SkillForm     init={item as SkillItem | null}      onSave={handleSave} />}
          {tab === "path"      && <PathForm      init={item as LearningPathNode | null} onSave={handleSave} />}
          {tab === "interview" && <InterviewForm init={item as InterviewQuestion | null} onSave={handleSave} />}
          {tab === "career"    && <CareerForm    init={item as CareerMilestone | null}   onSave={handleSave} />}
          {tab === "tools"     && <ToolForm      init={item as ToolItem | null}         onSave={handleSave} />}
        </div>
      </div>
    </div>
  );
} 