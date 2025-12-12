export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface Timeline {
  now: string;
  soon: string;
  later: string;
}

export interface AnalysisItem {
  id: string;
  problem: string;
  lineStart: number; // Approximate line number
  vibeSmell: string; // The "Senior" explanation
  simplifiedExplanation: string; // The "Junior" explanation
  whyDetection: string; // "Why AI sees this"
  timeline: Timeline;
  risk: RiskLevel;
  minimalFix: string; // Text description
  suggestedFixCode?: string; // Actual code replacement
  fixChecklist?: string[]; // Step-by-step actions
}

export interface TopRisk {
  title: string;
  description: string;
}

export interface AnalysisResult {
  topRisk: TopRisk;
  summary: string;
  items: AnalysisItem[];
  costOfIgnoring: string;
  recommendedAction: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export enum UserMode {
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR'
}