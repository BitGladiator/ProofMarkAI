import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app/main.js';
import { createTestClient } from './test_helpers.js';
import { executeReview } from '../app/services/review_service.js';
import { validateAndSanitizeAiFindings } from '../app/services/ai_review_service.js';
import {
  AiProviderError,
  AiTimeoutError,
  AiRateLimitError
} from '../app/utils/errors.js';

const client = createTestClient(app);

describe('AI Failure Handling and Resilience Tests', () => {
  it('handles AI provider timeout safely with 504 AiTimeoutError', async () => {
    const mockTimeout = async () => {
      throw new AiTimeoutError('AI provider request timed out after 30s');
    };

    await assert.rejects(
      async () => {
        await executeReview(
          { draft_text: 'Test draft text for timeout check' },
          { customProviderCall: mockTimeout }
        );
      },
      (err) => {
        assert.equal(err instanceof AiTimeoutError, true);
        assert.equal(err.statusCode, 504);
        assert.equal(err.code, 'AI_TIMEOUT_ERROR');
        return true;
      }
    );
  });

  it('handles AI provider rate limit safely with 429 AiRateLimitError', async () => {
    const mockRateLimit = async () => {
      throw new AiRateLimitError('AI provider rate limit reached');
    };

    await assert.rejects(
      async () => {
        await executeReview(
          { draft_text: 'Test draft text for rate limit' },
          { customProviderCall: mockRateLimit }
        );
      },
      (err) => {
        assert.equal(err instanceof AiRateLimitError, true);
        assert.equal(err.statusCode, 429);
        assert.equal(err.code, 'AI_RATE_LIMIT_ERROR');
        return true;
      }
    );
  });

  it('handles upstream 502/503 AI errors without generating fake findings', async () => {
    const mockProviderOutage = async () => {
      throw new AiProviderError('Upstream model server unavailable', 503);
    };

    await assert.rejects(
      async () => {
        await executeReview(
          { draft_text: 'Test draft text for outage' },
          { customProviderCall: mockProviderOutage }
        );
      },
      (err) => {
        assert.equal(err instanceof AiProviderError, true);
        assert.equal(err.statusCode, 503);
        return true;
      }
    );
  });

  it('rejects malformed AI findings array that is not an array', () => {
    assert.throws(
      () => {
        validateAndSanitizeAiFindings('invalid string not array', ['VOICE-01']);
      },
      (err) => {
        assert.equal(err instanceof AiProviderError, true);
        assert.ok(err.message.includes('valid findings array'));
        return true;
      }
    );
  });

  it('filters out hallucinated/unknown evidence IDs from AI findings', () => {
    const validEvidenceIds = ['VOICE-01', 'FACT-01'];
    const rawAiFindings = [
      {
        category: 'Tone',
        severity: 'Medium',
        excerpt: 'super fast',
        explanation: 'Avoid exaggerations',
        evidence_ids: ['VOICE-01', 'FABRICATED-ID-999', 'HALLUCINATED-01']
      }
    ];

    const sanitized = validateAndSanitizeAiFindings(rawAiFindings, validEvidenceIds);
    assert.equal(sanitized.length, 1);
    // Only VOICE-01 should survive
    assert.deepEqual(sanitized[0].evidence_ids, ['VOICE-01']);
  });

  it('allows safe partial review status when allowPartialOnAiError is enabled', async () => {
    const mockFailingAi = async () => {
      throw new AiProviderError('Temporary connection drop to model');
    };

    const result = await executeReview(
      {
        draft_text: 'Every consumer should enjoy our service.',
        approved_terms: [{ id: 'TERM-01', preferred: 'customer', avoid: ['consumer'] }]
      },
      {
        customProviderCall: mockFailingAi,
        allowPartialOnAiError: true
      }
    );

    // Deterministic terminology finding should still be present
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].category, 'Terminology');
    // Review status metadata clearly marks AI check as failed
    assert.equal(result.review_status.terminology_check, 'completed');
    assert.equal(result.review_status.ai_review_check, 'failed');
    assert.ok(result.review_status.details.includes('AI review failed'));
  });

  it('rejects forbidden CORS origins with 403 status', async () => {
    const res = await client.get('/api/health', {
      Origin: 'http://malicious-site.example.com'
    });

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'CORS_ERROR');
  });
});
