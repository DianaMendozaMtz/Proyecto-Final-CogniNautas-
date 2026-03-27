
export type ModuleType = 'PHONOLOGICAL' | 'VISUOSPATIAL' | 'EXECUTIVE' | 'NONE';

export type ErrorCategory = 
  | 'NONE' 
  | 'PHON_SUBSTITUTION' | 'PHON_OMISSION' | 'PHON_ORDER' 
  | 'EXEC_RULE_VIOLATION' | 'EXEC_PREMATURE' | 'EXEC_DISTRACTOR' | 'EXEC_SWITCH_FAILURE'
  | 'MEM_TRUNCATION' | 'MEM_ORDER' | 'MEM_OMISSION'
  | 'SEM_INTRUSION' | 'SEM_SUBSTITUTION';

export interface TrialResult {
  module: ModuleType;
  subTask?: 'DIRECTO' | 'INVERSO' | 'CRECIENTE';
  sequenceLength?: number;
  presented?: string[] | number[];
  captured?: string[] | number[];
  accuracy: number;
  latency: number; // Reaction time in ms
  errorType: ErrorCategory;
  errorAnalysis?: string; // 🔹 NEW: Technical description of error
  feedbackMessage?: string; // 🔹 NEW: Encouraging message for the child
  isFatigueIndicator?: boolean;
  isExample?: boolean;
  timestamp: number;
}

export type OperationalMode = 'CLINICAL' | 'RESEARCH';

export interface ProfessionalData {
  fullName: string;
  licenseNumber: string;
  registryId: string;
  specialty: string;
  institution?: string;
  clinicalCode?: string;
}

export interface GuardianConsent {
  guardianName: string;
  relationship: string;
  acceptedTerms: boolean;
  signature: string; // Digital acknowledgment
  timestamp: number;
}

export interface ChronologicalAge {
  years: number;
  months: number;
  days: number;
  birthDate: string;
  evaluationDate: string;
}

export interface SessionData {
  id: string;
  childId: string; // Minimized child data
  userAge: number;
  chronologicalAge?: ChronologicalAge;
  gender?: string;
  trials: TrialResult[];
  summary?: SessionSummary;
  professional: ProfessionalData;
  consent: GuardianConsent;
  mode: OperationalMode;
  startTime: number;
  version: string;
}

export interface DomainScore {
  value: number;
  percentile: number;
  label: 'Fuerte' | 'Típico' | 'En desarrollo' | 'Necesita apoyo';
  interpretation: string;
}

export interface AALISSProfile {
  category: string;
  tendencies: string[];
  strengths: string[];
  supports: string[];
  disclaimer: string;
}

export interface ErrorPatternAnalysis {
  mostFrequent: ErrorCategory[];
  distribution: Record<string, number>;
  summary: string;
}

export interface NeuroProfile {
  phonologicalScore: number;
  visuospatialScore: number;
  visuospatialMaxSpan?: number;
  visuospatialRawScore?: number;
  visuospatialIsInvalid?: boolean;
  executiveScore: number;
  phonologicalMaxSpans?: {
    DIRECTO: number;
    INVERSO: number;
    CRECIENTE: number;
  };
  phonologicalRawScores?: {
    DIRECTO: number;
    INVERSO: number;
    CRECIENTE: number;
  };
  phonologicalTotalScore?: number;
  phonologicalScaledScore?: number;
  visuospatialScaledScore?: number;
  sumScaledScores?: number;
  imt?: number;
  imtPercentile?: string;
  imtConfidenceInterval?: string;
  imtCI90?: string;
  imtCI95?: string;
  imtClassification?: string;
  normativeAgeRange?: string;
  errorPatterns: string[];
  interpretation: string;
}

export interface SessionSummary {
  metadata: {
    professionalName: string;
    licenseNumber: string;
    mode: OperationalMode;
    startTime: number;
    endTime: number;
    version: string;
    consentStatus: boolean;
  };
  domains: {
    phonological: DomainScore;
    visuospatial: DomainScore;
    executive: DomainScore;
    processingSpeed: DomainScore;
    attention: DomainScore;
  };
  neuroProfile: NeuroProfile; // 🔹 NEW
  aaliss: AALISSProfile;
  errorAnalysis: ErrorPatternAnalysis;
  classification: string;
  feedback: string;
  parentReport: string;
  psychoeducation: {
    concepts: string;
    strategies: string[];
  };
  referralGuidance?: string;
}

export enum ClassificationProfile {
  VISUAL_DOMINANT = 'Dominancia Visual',
  VERBAL_DOMINANT = 'Dominancia Verbal',
  EXECUTIVE_WEAKNESS = 'Debilidad Ejecutiva',
  BALANCED_PROFILE = 'Perfil Equilibrado'
}
