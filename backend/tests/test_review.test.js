import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app/main.js';
import { createTestClient } from './test_helpers.js';
import { executeReview } from '../app/services/review_service.js';

const client = createTestClient(app);

describe('Review API Endpoint and Orchestration Tests', () => {
  it('rejects missing draft_text with 422 validation error', async () => {
    const res = await client.post('/api/review', {});

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('rejects empty string draft_text with 422 validation error', async () => {
    const res = await client.post('/api/review', { draft_text: '' });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.message.includes('non-whitespace'));
  });

  it('rejects whitespace-only draft_text with 422 validation error', async () => {
    const res = await client.post('/api/review', { draft_text: '   \n \t  ' });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.message.includes('non-whitespace'));
  });

  it('rejects oversized draft exceeding maximum configured length', async () => {
    const oversized = 'a'.repeat(25000);
    const res = await client.post('/api/review', { draft_text: oversized });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.message.includes('maximum allowed length'));
  });

  it('rejects malformed reference data with 422 validation error', async () => {
    const res = await client.post('/api/review', {
      draft_text: 'Hello world',
      approved_terms: [{ invalid_key: 'foo' }]
    });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('rejects duplicate reference IDs with 422 validation error', async () => {
    const res = await client.post('/api/review', {
      draft_text: 'Hello world',
      approved_facts: [
        { id: 'FACT-01', text: 'First fact' },
        { id: 'FACT-01', text: 'Duplicate fact' }
      ]
    });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.message.includes("Duplicate ID 'FACT-01'"));
  });

  it('accepts valid request with omitted references and uses sample defaults', async () => {
    const res = await client.post('/api/review', {
      draft_text: 'Our product is designed for every consumer.'
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.findings));
    assert.equal(res.body.needs_human_review, true);
    // Should have caught "consumer" from sample approved_terms.json
    assert.ok(res.body.findings.some((f) => f.excerpt === 'consumer' && f.suggestion === 'customer'));
    assert.equal(res.body.findings[0].id, 'F-001');
  });

  it('respects explicitly provided empty arrays [] without injecting sample references', async () => {
    const res = await client.post('/api/review', {
      draft_text: 'Our product is designed for every consumer.',
      approved_terms: [],
      brand_guidelines: [],
      approved_facts: []
    });

    assert.equal(res.status, 200);
    // Because approved_terms was explicitly empty [], no terminology rules fired
    assert.equal(res.body.findings.length, 0);
    assert.equal(res.body.needs_human_review, true);
  });

  /* Representative Draft Examples (1 to 5) */

  // Example 1: Terminology violation
  it('Example 1: flags terminology violation deterministically', async () => {
    const result = await executeReview({
      draft_text: 'We help every consumer achieve their goals.',
      approved_terms: [
        { id: 'TERM-01', preferred: 'customer', avoid: ['consumer'] }
      ]
    });

    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].category, 'Terminology');
    assert.equal(result.findings[0].excerpt, 'consumer');
    assert.equal(result.findings[0].suggestion, 'customer');
    assert.deepEqual(result.findings[0].evidence_ids, ['TERM-01']);
    assert.equal(result.needs_human_review, true);
  });

  // Example 2: Clean draft with zero issues
  it('Example 2: clean compliant draft produces zero findings and appropriate summary', async () => {
    const result = await executeReview({
      draft_text: 'We help every customer achieve their goals with clear guidance.',
      approved_terms: [
        { id: 'TERM-01', preferred: 'customer', avoid: ['consumer'] }
      ]
    });

    assert.equal(result.findings.length, 0);
    assert.ok(result.review_summary.includes('0 issues'));
    assert.equal(result.needs_human_review, true);
  });

  // Example 3: Tone & hyperbole violation with mocked AI
  it('Example 3: flags tone and hyperbole violation via AI review', async () => {
    const mockAiProvider = async () => [
      {
        category: 'Tone',
        severity: 'Medium',
        excerpt: 'best in the world without question',
        explanation: 'Avoid unsubstantiated superlatives and hyperbolic claims.',
        suggestion: 'a leading solution',
        evidence_ids: ['VOICE-01'],
        confidence: 'high'
      }
    ];

    const result = await executeReview(
      {
        draft_text: 'Our platform is the best in the world without question.',
        brand_guidelines: [
          { id: 'VOICE-01', text: 'Avoid unsubstantiated superlatives and hyperbole.' }
        ]
      },
      { customProviderCall: mockAiProvider }
    );

    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].id, 'F-001');
    assert.equal(result.findings[0].category, 'Tone');
    assert.equal(result.findings[0].severity, 'Medium');
    assert.deepEqual(result.findings[0].evidence_ids, ['VOICE-01']);
    assert.equal(result.needs_human_review, true);
  });

  // Example 4: Unverified claim flags for human verification rather than declaring false
  it('Example 4: unverified factual claim is flagged for human verification', async () => {
    const mockAiProvider = async () => [
      {
        category: 'Claims',
        severity: 'High',
        excerpt: 'We guarantee 100% server uptime forever',
        explanation: 'The claim cannot be verified using supplied approved facts.',
        suggestion: null,
        evidence_ids: ['UNKNOWN-EVIDENCE-99'], // Fabricated ID from model
        confidence: 'medium'
      }
    ];

    const result = await executeReview(
      {
        draft_text: 'We guarantee 100% server uptime forever.',
        approved_facts: [
          { id: 'FACT-01', text: 'The service is available in 10 regions.' }
        ]
      },
      { customProviderCall: mockAiProvider }
    );

    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].category, 'Claims');
    // Unknown evidence ID must be rejected/filtered out!
    assert.deepEqual(result.findings[0].evidence_ids, []);
    assert.ok(result.findings[0].explanation.toLowerCase().includes('verification'));
  });

  // Example 5: Composite multi-rule review (terminology + tone + factual claim)
  it('Example 5: composite review merges deterministic terminology and AI findings cleanly', async () => {
    const mockAiProvider = async () => [
      {
        category: 'Tone',
        severity: 'Medium',
        excerpt: 'revolutionary breakthrough',
        explanation: 'Hyperbolic phrasing discouraged by brand voice guidelines.',
        suggestion: 'modern feature',
        evidence_ids: ['VOICE-01'],
        confidence: 'medium'
      },
      {
        category: 'FactualConsistency',
        severity: 'High',
        excerpt: 'available in 50 countries',
        explanation: 'Contradicts FACT-01 stating service is in 10 regions.',
        suggestion: 'available in 10 regions',
        evidence_ids: ['FACT-01'],
        confidence: 'high'
      }
    ];

    const result = await executeReview(
      {
        draft_text: 'Every consumer enjoys our revolutionary breakthrough available in 50 countries.',
        brand_guidelines: [{ id: 'VOICE-01', text: 'Avoid hyperbolic phrasing.' }],
        approved_terms: [{ id: 'TERM-01', preferred: 'customer', avoid: ['consumer'] }],
        approved_facts: [{ id: 'FACT-01', text: 'The service is available in 10 regions.' }]
      },
      { customProviderCall: mockAiProvider }
    );

    // Should contain 3 distinct findings: 1 terminology, 1 tone, 1 factual consistency
    assert.equal(result.findings.length, 3);
    assert.equal(result.findings[0].id, 'F-001');
    assert.equal(result.findings[0].category, 'Terminology');
    assert.equal(result.findings[1].id, 'F-002');
    assert.equal(result.findings[1].category, 'Tone');
    assert.equal(result.findings[2].id, 'F-003');
    assert.equal(result.findings[2].category, 'FactualConsistency');
    assert.equal(result.needs_human_review, true);
    assert.ok(result.review_summary.includes('3 potential issues'));
  });
});
