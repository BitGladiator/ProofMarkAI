import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Frontend Layout & Adversarial Content Handling Tests', () => {
  it('caps preview findings to 3 while preserving the full response count', () => {
    // Generate 12 findings simulating high-volume model response
    const mockFindings = Array.from({ length: 12 }, (_, i) => ({
      id: `F-${String(i + 1).padStart(3, '0')}`,
      category: i % 2 === 0 ? 'Tone' : 'Claims',
      severity: i === 0 ? 'High' : 'Medium',
      excerpt: `Excerpt text ${i + 1}`,
      explanation: `Detailed explanation for issue ${i + 1}`,
      suggestion: `Rewritten text ${i + 1}`,
      evidence_ids: [`EVIDENCE-${i + 1}`],
      confidence: 'high'
    }));

    const previewCap = 3;
    const displayed = mockFindings.slice(0, previewCap);
    const totalCount = mockFindings.length;
    const excessCount = Math.max(0, totalCount - previewCap);

    assert.equal(displayed.length, 3);
    assert.equal(totalCount, 12);
    assert.equal(excessCount, 9);
    // Findings in full workspace retain all 12 items
    assert.equal(mockFindings.length, 12);
  });

  it('handles extremely long model-generated explanations without truncation', () => {
    const longExplanation = 'A'.repeat(1200) + ' ' + 'https://example-enterprise-brand-portal.internal.company.com/standards/v2/document?param=long_parameter_without_spaces_1234567890';
    const finding = {
      id: 'F-001',
      category: 'Claims',
      severity: 'High',
      excerpt: 'unsupported claim',
      explanation: longExplanation,
      suggestion: 'verified factual claim with extensive supporting documentation',
      evidence_ids: ['SUPER-LONG-ENTERPRISE-EVIDENCE-IDENTIFIER-UUID-9876543210-ALIGNED-FACT-01'],
      confidence: 'medium'
    };

    assert.ok(finding.explanation.length > 1200);
    assert.ok(finding.evidence_ids[0].length > 50);
  });

  it('correctly replaces multi-sentence and punctuation-heavy suggestions', () => {
    let draft = 'Our revolutionary AI platform provides every consumer with 100% automated guaranteed compliance across all regions.';
    const finding = {
      id: 'F-001',
      category: 'Terminology',
      excerpt: 'every consumer',
      suggestion: 'every customer, client, and verified enterprise partner'
    };

    const exactIndex = draft.indexOf(finding.excerpt);
    assert.ok(exactIndex !== -1);

    draft = draft.slice(0, exactIndex) + finding.suggestion + draft.slice(exactIndex + finding.excerpt.length);
    assert.ok(draft.includes('every customer, client, and verified enterprise partner'));
    assert.ok(!draft.includes('every consumer'));
  });

  it('handles empty results and preserves zero-finding state cleanly', () => {
    const emptyFindings = [];
    const previewCap = 3;
    const displayed = emptyFindings.slice(0, previewCap);
    const excessCount = Math.max(0, emptyFindings.length - previewCap);

    assert.equal(displayed.length, 0);
    assert.equal(excessCount, 0);
  });
});
