import type { LearningModule } from "./types";
import { foundationsModule } from "./modules/foundations";
import { ragModule } from "./modules/rag";
import { finetuneModule } from "./modules/finetune";
import { evaluationModule } from "./modules/evaluation";
import { deployModule } from "./modules/deploy";
import { agentModule } from "./modules/agent";
import { projectModule } from "./modules/project";
import { aipmModule } from "./modules/aipm";

export type { KnowledgeLevel, KnowledgeNode, CaseStudy, OperationStep, LearningModule } from "./types";

export const learningModules: LearningModule[] = [
  foundationsModule,
  ragModule,
  finetuneModule,
  evaluationModule,
  deployModule,
  agentModule,
  projectModule,
  aipmModule,
];
