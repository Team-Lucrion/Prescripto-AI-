
export enum DocumentType {
  PRESCRIPTION = 'PRESCRIPTION',
  HOSPITAL_BILL = 'HOSPITAL_BILL',
  LAB_REPORT = 'LAB_REPORT',
  INSURANCE_REJECTION = 'INSURANCE_REJECTION'
}

export interface SimplifiedTerm {
  jargon: string;
  meaning: string;
  importance: string;
}

export interface CriticalFinding {
  issue: string;
  description: string;
  action: string;
}

export interface GenericAlternative {
  brandedName: string;
  genericName: string;
  approxBrandedPrice: string;
  approxGenericPrice: string;
  savingsPercentage: string;
}

export interface CostInsights {
  procedureName: string;
  billedAmount: string;
  expectedRange: {
    privateLow: string;
    privateHigh: string;
    government: string;
  };
  isOvercharged: boolean;
  tierComparison: string;
}

export interface MedicalAnalysis {
  id?: string;
  timestamp?: number;
  isPro?: boolean;
  documentType: string;
  summary: string;
  simplifiedTerms: SimplifiedTerm[];
  criticalFindings: CriticalFinding[];
  genericAlternatives?: GenericAlternative[];
  costInsights?: CostInsights;
  nextSteps: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  cityTier: 'Tier-1' | 'Tier-2' | 'Tier-3';
  credits?: number;
  role?: 'user' | 'admin';
}

export interface CreditPack {
  id: string;
  name: string;
  price: number;
  credits: number;
  label: string;
  badge?: string;
  description: string;
}

export interface UserCredits {
  user_id: string;
  credits: number;
  role: 'user' | 'admin';
  is_pro: boolean;
  updated_at: string;
}

export interface AnalysisState {
  file: File | null;
  preview: string | null;
  isAnalyzing: boolean;
  result: MedicalAnalysis | null;
  error: string | null;
}
