
export type ModuleType = 'PHONOLOGICAL' | 'VISUOSPATIAL' | 'EXECUTIVE' | 'NONE';

export interface TrialResult {
  module: ModuleType;
  sequenceLength?: number;
  presented?: string[] | number[];
  captured?: string[] | number[];
  accuracy: number;
  latency: number;
  errorType: 'NONE' | 'OMISSION' | 'SUBSTITUTION' | 'ORDER' | 'POSITION' | 'INTRUSION';
  timestamp: number;
}

export interface SessionData {
  id: string;
  userName: string;
  userAge: number;
  trials: TrialResult[];
  summary?: SessionSummary;
}

export interface SessionSummary {
  phonologicalMeanAccuracy: number;
  phonologicalMaxSpan: number;
  visuospatialMeanAccuracy: number;
  visuospatialMaxSpan: number;
  executiveDualAccuracy: number;
  executiveInterferenceCost: number;
  classification: string;
  feedback: string;
  parentReport: string;
}

export enum ClassificationProfile {
  VISUAL_DOMINANT = 'Dominancia Visual',
  VERBAL_DOMINANT = 'Dominancia Verbal',
  EXECUTIVE_WEAKNESS = 'Debilidad Ejecutiva',
  BALANCED_PROFILE = 'Perfil Equilibrado'
}
