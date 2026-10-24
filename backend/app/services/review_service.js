import { ReviewRequestSchema, ReviewResponseSchema } from '../schemas/review.js';
import { resolveReferences } from './reference_service.js';
import { checkTerminology } from '../rules/terminology.js';
import { reviewWithAi, isAiConfigured } from './ai_review_service.js';
import { mergeFindings, generateReviewSummary } from './finding_merger.js';
import { ValidationError } from '../utils/errors.js';
import logger from '../core/logging.js';

/**
 * Orchestrates the full review lifecycle.
 *
 * @param {object} payload - Incoming request payload
 * @param {object} [options] - Optional execution options (e.g., custom AI invoker for testing)
 * @returns {Promise<object>} - Validated ReviewResponse
 */
export async function executeReview(payload, options = {}) {
  // 1. Validate request payload using Zod
  const validationResult = ReviewRequestSchema.safeParse(payload);
  if (!validationResult.success) {
    const issues = validationResult.error.issues || validationResult.error.errors || [];
    const errorDetails = issues.map((e) => ({
      field: (e.path || []).join('.'),
      message: e.message
    }));
    throw new ValidationError(errorDetails[0]?.message || 'Invalid request body', errorDetails);
  }

  const { draft_text } = validationResult.data;

  // 2. Resolve references (supplied or sample fallback per policy)
  const references = resolveReferences(payload);

  // 3. Run deterministic terminology checks (independent of LLM)
  const terminologyFindings = checkTerminology(draft_text, references.approved_terms);
  logger.info(`Terminology check identified ${terminologyFindings.length} issue(s)`);

  let aiFindings = [];
  let aiReviewSummary = null;
  let aiCheckStatus = 'skipped';
  let aiStatusDetails = undefined;

  // 4. Run AI review if configured or if a custom provider call is injected (e.g. in tests)
  const hasCustomCall = typeof options.customProviderCall === 'function';
  const shouldRunAi = hasCustomCall || isAiConfigured();

  if (shouldRunAi) {
    try {
      logger.info('Executing AI-powered brand review via Groq Cloud');
      const aiResult = await reviewWithAi(
        draft_text,
        references.brand_guidelines,
        references.approved_terms,
        references.approved_facts,
        options
      );

      if (Array.isArray(aiResult)) {
        aiFindings = aiResult;
      } else if (aiResult && typeof aiResult === 'object') {
        aiFindings = Array.isArray(aiResult.findings) ? aiResult.findings : [];
        if (typeof aiResult.review_summary === 'string' && aiResult.review_summary.trim()) {
          aiReviewSummary = aiResult.review_summary.trim();
        }
      }

      aiCheckStatus = 'completed';
    } catch (err) {
      logger.error(`AI review error: ${err.message}`, { code: err.code });
      // If client explicitly passed partialMode = true, record failure in metadata, otherwise propagate safe HTTP error
      if (options.allowPartialOnAiError) {
        aiCheckStatus = 'failed';
        aiStatusDetails = `AI review failed: ${err.message}`;
      } else {
        throw err;
      }
    }
  } else {
    logger.info('AI review skipped because AI_PROVIDER is not configured');
    aiStatusDetails = 'AI review skipped: AI_PROVIDER / AI_API_KEY is not configured in environment.';
  }

  // 5. Merge findings and remove genuine duplicates
  const mergedFindings = mergeFindings(terminologyFindings, aiFindings);

  // 6. Review summary: prioritize live AI-generated assessment when AI review succeeded
  const summary = aiReviewSummary || generateReviewSummary(mergedFindings);

  // 7. Assemble final response conforming to canonical schema
  const responseData = {
    findings: mergedFindings,
    review_summary: summary,
    needs_human_review: true,
    review_status: {
      terminology_check: 'completed',
      ai_review_check: aiCheckStatus,
      ...(aiStatusDetails ? { details: aiStatusDetails } : {})
    }
  };

  // Validate outgoing response with Zod
  return ReviewResponseSchema.parse(responseData);
}

export default {
  executeReview
};
