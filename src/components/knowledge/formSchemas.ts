/**
 * formSchemas.ts
 * Defines field-level schemas for each tab type's editor form.
 * DynamicForm in TabItemEditor.tsx uses these to render forms without
 * per-tab Form components.
 *
 * To add a new tab type:
 *   1. Add its type definition to types.ts
 *   2. Add an entry to WIDGET_MODULE_MAP in types.ts
 *   3. Add a schema entry here — no other changes needed.
 */
import { KNOWLEDGE_LEVELS, TAB_WIDGET, KNOWLEDGE_LEVEL_DEFAULT, INTERVIEW_DIFFICULTIES, INTERVIEW_DIFFICULTY_DEFAULT } from "@/data/types";

// ── Field Types ────────────────────────────────────────────────────────────

export type FieldDef =
  | { type: "text";     key: string; labelKey: string; placeholderKey?: string; placeholder?: string; required?: boolean }
  | { type: "textarea"; key: string; labelKey: string; placeholderKey?: string; placeholder?: string; rows?: number; required?: boolean; autoFocus?: boolean }
  | { type: "number";   key: string; labelKey: string; placeholderKey?: string; placeholder?: string }
  | { type: "list";     key: string; labelKey: string; placeholderKey?: string; placeholder?: string }
  | { type: "radio";    key: string; labelKey: string; options: string[] | ((t: Record<string, unknown>) => string[]); defaultOption?: string | ((t: Record<string, unknown>) => string) }
  | { type: "toggle";   key: string; labelKey: string }
  | { type: "row";      fields: FieldDef[] };  // renders fields side-by-side

export interface TabFormSchema {
  tabKey: string;       // matches defaultTab in WIDGET_MODULE_MAP
  idPrefix: string;     // prefix for genId()
  requiredKey: string;  // the field key used for required validation + autofocus
  fields: FieldDef[];
}

// ── Schemas ───────────────────────────────────────────────────────────────

export const TAB_FORM_SCHEMAS: TabFormSchema[] = [
  {
    tabKey: TAB_WIDGET.Operation,
    idPrefix: "op",
    requiredKey: "title",
    fields: [
      { type: "text",     key: "title",  labelKey: "opTitle",  placeholderKey: "opTitlePh",  required: true },
      { type: "text",     key: "target", labelKey: "opTarget", placeholderKey: "opTargetPh" },
      { type: "textarea", key: "detail", labelKey: "opDetail", placeholderKey: "opDetailPh", rows: 3 },
      { type: "list",     key: "tools",  labelKey: "opTools",  placeholderKey: "opToolPh" },
    ],
  },
  {
    tabKey: TAB_WIDGET.Cases,
    idPrefix: "case",
    requiredKey: "title",
    fields: [
      { type: "text",  key: "title",    labelKey: "caseTitle",    placeholderKey: "caseTitlePh",   required: true },
      { type: "text",  key: "scene",    labelKey: "caseScene",    placeholderKey: "caseScenePh" },
      { type: "row", fields: [
        { type: "textarea", key: "problem",  labelKey: "caseProblem",  placeholderKey: "caseProblemPh",  rows: 2 },
        { type: "textarea", key: "solution", labelKey: "caseSolution", placeholderKey: "caseSolutionPh", rows: 2 },
      ]},
      { type: "text",  key: "result",   labelKey: "caseResult",   placeholderKey: "caseResultPh" },
      { type: "list",  key: "tags",     labelKey: "caseTags",     placeholderKey: "caseTagPh" },
    ],
  },
  {
    tabKey: TAB_WIDGET.Skills,
    idPrefix: "skill",
    requiredKey: "name",
    fields: [
      { type: "row", fields: [
        { type: "text", key: "name",      labelKey: "skillName",      placeholderKey: "skillNamePh",      required: true },
        { type: "text", key: "dimension", labelKey: "skillDimension", placeholderKey: "skillDimensionPh" },
      ]},
      { type: "radio",    key: "level",       labelKey: "skillLevel",  options: ["1","2","3","4","5"],       defaultOption: "3" },
      { type: "textarea", key: "description", labelKey: "skillDesc",   placeholderKey: "skillDescPh", rows: 2 },
      { type: "list",     key: "howTo",       labelKey: "skillHowTo",  placeholderKey: "skillHowToPh" },
    ],
  },
  {
    tabKey: TAB_WIDGET.Path,
    idPrefix: "path",
    requiredKey: "title",
    fields: [
      { type: "text",  key: "title", labelKey: "pathTitle", placeholderKey: "pathTitlePh", required: true },
      { type: "row", fields: [
        { type: "radio",  key: "level", labelKey: "pathDifficulty", options: [...KNOWLEDGE_LEVELS], defaultOption: KNOWLEDGE_LEVEL_DEFAULT },
        { type: "number", key: "estimatedHours", labelKey: "pathHours", placeholderKey: "pathHoursPh" },
      ]},
      { type: "text",  key: "tip",   labelKey: "pathTip",   placeholderKey: "pathTipPh" },
    ],
  },
  {
    tabKey: TAB_WIDGET.Interview,
    idPrefix: "iq",
    requiredKey: "question",
    fields: [
      { type: "textarea", key: "question",    labelKey: "iqQuestion",    placeholderKey: "iqQuestionPh",    rows: 2, required: true, autoFocus: true },
      { type: "row", fields: [
        { type: "radio", key: "category",   labelKey: "iqCategory",   options: (t) => [t.iqCatTech, t.iqCatProduct, t.iqCatBusiness, t.iqCatBehavior] as string[], defaultOption: (t) => t.iqCatTech as string },
        { type: "radio", key: "difficulty", labelKey: "iqDifficulty", options: [...INTERVIEW_DIFFICULTIES], defaultOption: INTERVIEW_DIFFICULTY_DEFAULT },
      ]},
      { type: "text",     key: "framework",   labelKey: "iqFramework",   placeholderKey: "iqFrameworkPh" },
      { type: "list",     key: "keyPoints",   labelKey: "iqKeyPoints",   placeholderKey: "iqKeyPointPh" },
      { type: "textarea", key: "sampleAnswer", labelKey: "iqSampleAnswer", placeholderKey: "iqSampleAnswerPh", rows: 3 },
      { type: "text",     key: "pitfall",     labelKey: "iqPitfall",     placeholderKey: "iqPitfallPh" },
    ],
  },
  {
    tabKey: TAB_WIDGET.Career,
    idPrefix: "career",
    requiredKey: "week",
    fields: [
      { type: "row", fields: [
        { type: "text", key: "week",  labelKey: "careerWeek",  placeholderKey: "careerWeekPh",  required: true },
        { type: "text", key: "phase", labelKey: "careerPhase", placeholderKey: "careerPhasePh" },
      ]},
      { type: "text",     key: "goal",        labelKey: "careerGoal",        placeholderKey: "careerGoalPh" },
      { type: "list",     key: "actions",     labelKey: "careerActions",     placeholderKey: "careerActionPh" },
      { type: "text",     key: "deliverable", labelKey: "careerDeliverable", placeholderKey: "careerDeliverablePh" },
      { type: "list",     key: "resources",   labelKey: "careerResources",   placeholderKey: "careerResourcePh" },
      { type: "text",     key: "checkPoint",  labelKey: "careerCheckPoint",  placeholderKey: "careerCheckPointPh" },
    ],
  },
  {
    tabKey: TAB_WIDGET.Tools,
    idPrefix: "tool",
    requiredKey: "name",
    fields: [
      { type: "row", fields: [
        { type: "text", key: "name", labelKey: "toolName", placeholderKey: "toolNamePh", required: true },
        { type: "text", key: "url",  labelKey: "toolUrl",  placeholder: "https://" },
      ]},
      { type: "radio",    key: "category",    labelKey: "toolCategory", options: (t) => [t.toolCatAiWrite, t.toolCatAiImage, t.toolCatAiCode, t.toolCatAiSearch, t.toolCatAiVideo, t.toolCatAiAudio, t.toolCatDev, t.toolCatProductivity, t.toolCatOther] as string[] },
      { type: "textarea", key: "description", labelKey: "toolDesc",     placeholderKey: "toolDescPh", rows: 2 },
      { type: "list",     key: "tags",        labelKey: "toolTags",     placeholderKey: "toolTagPh" },
      { type: "toggle",   key: "isPaid",      labelKey: "toolIsPaid" },
    ],
  },
];

export const TAB_FORM_SCHEMA_MAP: Record<string, TabFormSchema> =
  Object.fromEntries(TAB_FORM_SCHEMAS.map(s => [s.tabKey, s]));
