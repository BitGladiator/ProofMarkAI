import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const samplesPath = path.resolve(__dirname, '../data/samples.json');
const samples = JSON.parse(fs.readFileSync(samplesPath, 'utf8'));

describe('Frontend Data and Samples Tests', () => {
  it('sampleDraft contains realistic copy with targeted violations', () => {
    assert.ok(samples.sampleDraft.length > 50);
    // Contains "consumer" (violates TERM-01)
    assert.ok(samples.sampleDraft.toLowerCase().includes('consumer'));
    // Contains "magic bot" (violates TERM-02)
    assert.ok(samples.sampleDraft.toLowerCase().includes('magic bot'));
    // Contains "sandbox workspace" (violates TERM-03)
    assert.ok(samples.sampleDraft.toLowerCase().includes('sandbox workspace'));
  });

  it('brandGuidelines has valid schema entries', () => {
    assert.ok(samples.brandGuidelines.length >= 3);
    for (const g of samples.brandGuidelines) {
      assert.ok(g.id.startsWith('VOICE-'));
      assert.ok(g.text.length > 10);
    }
  });

  it('approvedTerms has valid schema entries', () => {
    assert.ok(samples.approvedTerms.length >= 4);
    for (const t of samples.approvedTerms) {
      assert.ok(t.id.startsWith('TERM-'));
      assert.ok(t.preferred.length > 0);
      assert.ok(Array.isArray(t.avoid) && t.avoid.length > 0);
    }
  });

  it('approvedFacts has valid schema entries', () => {
    assert.ok(samples.approvedFacts.length >= 4);
    for (const f of samples.approvedFacts) {
      assert.ok(f.id.startsWith('FACT-'));
      assert.ok(f.text.length > 5);
    }
  });
});
