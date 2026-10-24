import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkTerminology } from '../app/rules/terminology.js';

describe('Deterministic Terminology Engine Tests', () => {
  const sampleRules = [
    {
      id: 'TERM-01',
      preferred: 'customer',
      avoid: ['consumer', 'clientele']
    },
    {
      id: 'TERM-02',
      preferred: 'AI assistant',
      avoid: ['magic bot', 'AI robot']
    },
    {
      id: 'TERM-03',
      preferred: 'workspace',
      avoid: ['sandbox workspace']
    }
  ];

  it('detects single terminology violation and suggests preferred term', () => {
    const text = 'Every consumer should enjoy our service.';
    const findings = checkTerminology(text, sampleRules);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].category, 'Terminology');
    assert.equal(findings[0].severity, 'Low');
    assert.equal(findings[0].excerpt, 'consumer');
    assert.equal(findings[0].suggestion, 'customer');
    assert.deepEqual(findings[0].evidence_ids, ['TERM-01']);
    assert.equal(findings[0].confidence, 'high');
  });

  it('preserves uppercase casing in suggestion (Consumer -> Customer, CONSUMER -> CUSTOMER)', () => {
    const text = 'Consumer satisfaction is key, and CONSUMER feedback matters.';
    const findings = checkTerminology(text, sampleRules);

    assert.equal(findings.length, 2);
    assert.equal(findings[0].excerpt, 'Consumer');
    assert.equal(findings[0].suggestion, 'Customer');
    assert.equal(findings[1].excerpt, 'CONSUMER');
    assert.equal(findings[1].suggestion, 'CUSTOMER');
  });

  it('does NOT falsely match unrelated substrings within longer words', () => {
    // "consumerism" and "proconsumer" should NOT trigger rule for "consumer"
    const text = 'Modern consumerism and proconsumer policies are distinct from individuals.';
    const findings = checkTerminology(text, sampleRules);

    assert.equal(findings.length, 0);
  });

  it('handles multi-word avoid phrases like "magic bot" and "sandbox workspace"', () => {
    const text = 'Try our new magic bot inside your sandbox workspace today.';
    const findings = checkTerminology(text, sampleRules);

    assert.equal(findings.length, 2);
    assert.equal(findings[0].excerpt, 'magic bot');
    assert.equal(findings[0].suggestion, 'AI assistant');
    assert.deepEqual(findings[0].evidence_ids, ['TERM-02']);

    assert.equal(findings[1].excerpt, 'sandbox workspace');
    assert.equal(findings[1].suggestion, 'workspace');
    assert.deepEqual(findings[1].evidence_ids, ['TERM-03']);
  });

  it('handles multiple occurrences of different terminology rules without duplicates', () => {
    const text = 'The clientele loves our magic bot, while another consumer prefers the platform.';
    const findings = checkTerminology(text, sampleRules);

    assert.equal(findings.length, 3);
    const excerpts = findings.map((f) => f.excerpt.toLowerCase());
    assert.ok(excerpts.includes('clientele'));
    assert.ok(excerpts.includes('magic bot'));
    assert.ok(excerpts.includes('consumer'));
  });

  it('returns empty list when no terminology violations exist', () => {
    const text = 'Our customer workspace is fully operational.';
    const findings = checkTerminology(text, sampleRules);

    assert.equal(findings.length, 0);
  });

  it('returns empty list when approved_terms array is empty or null', () => {
    const text = 'Our consumer loves this.';
    assert.deepEqual(checkTerminology(text, []), []);
    assert.deepEqual(checkTerminology(text, null), []);
  });

  it('handles empty or whitespace draft text safely', () => {
    assert.deepEqual(checkTerminology('', sampleRules), []);
    assert.deepEqual(checkTerminology('   ', sampleRules), []);
  });
});
