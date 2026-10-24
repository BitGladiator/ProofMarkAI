import { z } from 'zod';
import { config } from '../core/config.js';

export const BrandGuidelineSchema = z.object({
  id: z.string().trim().min(1, 'Guideline ID is required'),
  text: z.string().trim().min(1, 'Guideline text is required')
});

export const ApprovedTermSchema = z.object({
  id: z.string().trim().min(1, 'Terminology rule ID is required'),
  preferred: z.string().trim().min(1, 'Preferred term is required'),
  avoid: z.array(z.string().trim().min(1, 'Avoid term cannot be empty')).min(1, 'At least one avoid term must be provided')
});

export const ApprovedFactSchema = z.object({
  id: z.string().trim().min(1, 'Fact ID is required'),
  text: z.string().trim().min(1, 'Fact text is required')
});

export const ReviewRequestSchema = z.object({
  draft_text: z.string({
    required_error: 'draft_text is required',
    invalid_type_error: 'draft_text must be a string'
  })
    .refine((val) => val.trim().length > 0, {
      message: 'draft_text must contain non-whitespace text'
    })
    .refine((val) => val.length <= config.MAX_DRAFT_LENGTH, {
      message: `draft_text exceeds maximum allowed length of ${config.MAX_DRAFT_LENGTH} characters`
    }),
  brand_guidelines: z.array(BrandGuidelineSchema).optional(),
  approved_terms: z.array(ApprovedTermSchema).optional(),
  approved_facts: z.array(ApprovedFactSchema).optional()
});

export const FindingCategoryEnum = z.enum([
  'Terminology',
  'Tone',
  'Claims',
  'FactualConsistency',
  'Accessibility'
]);

export const FindingSeverityEnum = z.enum([
  'Low',
  'Medium',
  'High'
]);

export const FindingConfidenceEnum = z.enum([
  'low',
  'medium',
  'high'
]);

export const FindingSchema = z.object({
  id: z.string().min(1),
  category: FindingCategoryEnum,
  severity: FindingSeverityEnum,
  excerpt: z.string(),
  explanation: z.string(),
  suggestion: z.string().nullable().optional(),
  evidence_ids: z.array(z.string()).default([]),
  confidence: FindingConfidenceEnum
});

export const ReviewCheckStatusEnum = z.enum([
  'completed',
  'skipped',
  'failed'
]);

export const ReviewStatusMetadataSchema = z.object({
  terminology_check: ReviewCheckStatusEnum,
  ai_review_check: ReviewCheckStatusEnum,
  details: z.string().optional()
});

export const ReviewResponseSchema = z.object({
  findings: z.array(FindingSchema),
  review_summary: z.string(),
  needs_human_review: z.literal(true),
  review_status: ReviewStatusMetadataSchema.optional()
});
