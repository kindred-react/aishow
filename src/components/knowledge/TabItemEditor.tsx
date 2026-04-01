"use client";
import React, { useState, useCallback } from "react";
import { X, Save, Trash2, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { TAB_LABEL_MAP } from "@/data/types";
import { TAB_FORM_SCHEMA_MAP } from "@/components/knowledge/formSchemas";
import { genId } from "@/lib/hooks";
import type { FieldDef } from "@/components/knowledge/formSchemas";

type T = ReturnType<typeof useI18n>["t"];
type FormState = Record<string, unknown>;

// ── ListEditor ────────────────────────────────────────────────────────────
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
        <button type="button" className="note-add-point" onClick={() => onChange([...items, ""])}><Plus size={12}/> {t.fieldAdd}</button>
      </div>
      <ul className="note-points-list">
        {items.map((v, i) => (
          <li key={i} className="note-point-item">
            <input className="note-input" value={v} placeholder={placeholder ?? t.fieldItemN(i + 1)}
              onChange={e => { const a = [...items]; a[i] = e.target.value; onChange(a); }} />
            <button type="button" className="note-remove-point" onClick={() => onChange(items.filter((_,j) => j!==i))}><X size={11}/></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── DynamicForm ───────────────────────────────────────────────────────────
// Renders form fields from a schema definition.
function renderField(
  field: FieldDef,
  state: FormState,
  setState: (k: string, v: unknown) => void,
  t: T,
  isFirst: boolean,
): React.ReactNode {
  const tRecord = t as Record<string, unknown>;

  if (field.type === "row") {
    let firstInRow = isFirst;
    return (
      <div key="row" className="grid gap-[0.7rem]" style={{ gridTemplateColumns: `repeat(${field.fields.length}, 1fr)` }}>
        {field.fields.map((f, i) => {
          const node = renderField(f, state, setState, t, firstInRow);
          if (firstInRow && f.type !== "row") firstInRow = false;
          return <React.Fragment key={i}>{node}</React.Fragment>;
        })}
      </div>
    );
  }

  const label = String(tRecord[field.labelKey] ?? field.labelKey);
  const ph = "placeholderKey" in field && field.placeholderKey
    ? String(tRecord[field.placeholderKey] ?? "")
    : "placeholder" in field && field.placeholder
      ? field.placeholder as string
      : undefined;
  const val = state[field.key];
  const isRequired = "required" in field && field.required;
  const shouldAutoFocus = isFirst || ("autoFocus" in field && field.autoFocus);

  if (field.type === "text") {
    return (
      <div className="note-field">
        <label className="note-label">{label}{isRequired && <span className="text-red-400"> *</span>}</label>
        <input
           
          autoFocus={shouldAutoFocus}
          className="note-input" value={String(val ?? "")} placeholder={ph}
          onChange={e => setState(field.key, e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="note-field">
        <label className="note-label">{label}{isRequired && <span className="text-[#f06060]"> *</span>}</label>
        <textarea
           
          autoFocus={shouldAutoFocus}
          className="note-textarea" value={String(val ?? "")} placeholder={ph} rows={field.rows ?? 2}
          onChange={e => setState(field.key, e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div className="note-field">
        <label className="note-label">{label}</label>
        <input className="note-input" type="number" value={String(val ?? "")} placeholder={ph}
          onChange={e => setState(field.key, e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "list") {
    const items = (val as string[] | undefined) ?? [""];
    return (
      <ListEditor label={label} items={items}
        onChange={v => setState(field.key, v)}
        placeholder={ph} t={t}
      />
    );
  }

  if (field.type === "radio") {
    const options = typeof field.options === "function" ? field.options(tRecord) : field.options;
    const current = String(val ?? "");
    return (
      <div className="note-field">
        <label className="note-label">{label}</label>
        <div className="node-level-btns flex-wrap">
          {options.map(opt => (
            <button key={opt} type="button"
              className={`node-level-btn ${current===opt?"active":""}`}
              onClick={() => setState(field.key, opt)}
            >{opt}</button>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "toggle") {
    return (
      <div className="note-field">
        <label className="note-label">
          <input type="checkbox" checked={Boolean(val)} onChange={e => setState(field.key, e.target.checked)} className="mr-1" />
          {label}
        </label>
      </div>
    );
  }

  return null;
}

function DynamicForm({ tabKey, init, onSave, t }: {
  tabKey: string;
  init: Record<string, unknown> | null;
  onSave: (item: Record<string, unknown>) => void;
  t: T;
}) {
  const schema = TAB_FORM_SCHEMA_MAP[tabKey];
  const tRecord = t as Record<string, unknown>;

  // Build default state from schema
  const buildDefaults = useCallback((): FormState => {
    if (!schema) return {};
    const defaults: FormState = {};
    const processFields = (fields: FieldDef[]) => {
      for (const f of fields) {
        if (f.type === "row") { processFields(f.fields); continue; }
        const existing = init?.[f.key];
        if (existing !== undefined) { defaults[f.key] = existing; continue; }
        if (f.type === "list")   { defaults[f.key] = [""]; continue; }
        if (f.type === "toggle") { defaults[f.key] = false; continue; }
        if (f.type === "radio") {
          const opts = typeof f.options === "function" ? f.options(tRecord) : f.options;
          const def = f.defaultOption
            ? typeof f.defaultOption === "function" ? f.defaultOption(tRecord) : f.defaultOption
            : opts[0];
          defaults[f.key] = init?.[f.key] ?? def;
          continue;
        }
        defaults[f.key] = "";
      }
    };
    processFields(schema.fields);
    return defaults;
  }, [schema, init, tRecord]);

  const [state, setStateRaw] = useState<FormState>(buildDefaults);
const setState = useCallback((k: string, v: unknown) =>
    setStateRaw(prev => ({ ...prev, [k]: v })), []);

  if (!schema) {
    return <p className="text-[#8aaccc] text-sm">No editor available for: {tabKey}</p>;
  }

  const save = () => {
    const reqVal = state[schema.requiredKey];
    const isEmpty = Array.isArray(reqVal) ? reqVal.length === 0 : !String(reqVal ?? "").trim();
    if (isEmpty) { return; }
    // Post-process: numbers, trimmed strings, filtered lists
    const processed: Record<string, unknown> = { id: String(init?.id ?? genId(schema.idPrefix)) };
    const processFields = (fields: FieldDef[]) => {
      for (const f of fields) {
        if (f.type === "row") { processFields(f.fields); continue; }
        const v = state[f.key];
        if (f.type === "number")  { processed[f.key] = v ? Number(v) : undefined; continue; }
        if (f.type === "list")    { processed[f.key] = (v as string[]).filter(Boolean); continue; }
        if (f.type === "toggle")  { processed[f.key] = Boolean(v); continue; }
        if (f.type === "textarea" || f.type === "text") {
          const trimmed = String(v ?? "").trim();
          processed[f.key] = trimmed || undefined;
          continue;
        }
        processed[f.key] = v;
      }
    };
    processFields(schema.fields);
    onSave(processed);
  };

  const firstFieldIndex = schema.fields.findIndex(f => f.type !== "row");
  return (
    <>
      {schema.fields.map((f, i) => {
        const node = renderField(f, state, setState, t, i === firstFieldIndex);
        return <React.Fragment key={i}>{node}</React.Fragment>;
      })}
      <button type="button" className="note-save-btn note-save-btn-active" onClick={save}><Save size={13}/> {t.saveChanges}</button>
    </>
  );
}

// TAB_LABEL_MAP imported from @/data/types

// ── TabItemEditor ─────────────────────────────────────────────────────────

export type TabItemType = string;

interface TabItemEditorProps {
  tab: string;
  item: Record<string, unknown> | null;
  onSave: (item: Record<string, unknown>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function TabItemEditor({ tab, item, onSave, onDelete, onClose }: TabItemEditorProps) {
  const isNew = item === null;
  const { t } = useI18n();

  const tRecord = t as Record<string, unknown>;
  const label = TAB_LABEL_MAP[tab] ?? tab;

  const handleSave = (saved: Record<string, unknown>) => {
    onSave(saved);
    onClose();
  };

  const handleDelete = () => {
    const confirmMsg = typeof tRecord.tabItemDeleteConfirm === "function"
      ? (tRecord.tabItemDeleteConfirm as (l: string) => string)(label)
      : `Delete ${label}?`;
    if (!confirm(confirmMsg)) return;
    onDelete?.();
    onClose();
  };

  const titleMsg = isNew
    ? typeof tRecord.tabItemAdd === "function" ? (tRecord.tabItemAdd as (l: string) => string)(label) : `Add ${label}`
    : typeof tRecord.tabItemEdit === "function" ? (tRecord.tabItemEdit as (l: string) => string)(label) : `Edit ${label}`;

  return (
    <div className="note-overlay" onClick={onClose}>
      <div className="note-modal note-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="note-modal-header">
          <span>{titleMsg}</span>
          <div className="flex gap-2">
            {!isNew && onDelete && (
              <button type="button" className="note-delete-btn" onClick={handleDelete}><Trash2 size={13}/> {t.deleteNode}</button>
            )}
            <button type="button" className="note-close" onClick={onClose}><X size={14}/></button>
          </div>
        </div>
        <div className="note-edit-body">
          <DynamicForm tabKey={tab} init={item} onSave={handleSave} t={t} />
        </div>
      </div>
    </div>
  );
}
