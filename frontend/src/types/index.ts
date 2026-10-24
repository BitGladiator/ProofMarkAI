export interface BrandGuideline {
  id: string;
  text: string;
}

export interface ApprovedTerm {
  id: string;
  preferred: string;
  avoid: string[];
}

export interface ApprovedFact {
  id: string;
  text: string;
}

export interface ReviewRequest {
  draft_text: string;
  brand_guidelines?: BrandGuideline[];
  approved_terms?: ApprovedTerm[];
  approved_facts?: ApprovedFact[];
}

export type FindingCategory =
  | 'Terminology'
  | 'Tone'
  | 'Claims'
  | 'FactualConsistency'
  | 'Accessibility';

export type FindingSeverity = 'Low' | 'Medium' | 'High';

export type FindingConfidence = 'low' | 'medium' | 'high';

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  excerpt: string;
  explanation: string;
  suggestion?: string | null;
  evidence_ids: string[];
  confidence: FindingConfidence;
}

export interface ReviewStatusMetadata {
  terminology_check: 'completed' | 'skipped' | 'failed';
  ai_review_check: 'completed' | 'skipped' | 'failed';
  details?: string;
}

export interface ReviewResponse {
  findings: Finding[];
  review_summary: string;
  needs_human_review: boolean;
  review_status?: ReviewStatusMetadata;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
}
