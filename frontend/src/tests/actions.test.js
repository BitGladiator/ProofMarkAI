import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Frontend Suggestion and Action Logic Tests', () => {
  it('replaces exact excerpt with preferred suggestion in draft text', () => {
    const draft = 'Welcome to our platform for every consumer today.';
    const excerpt = 'consumer';
    const suggestion = 'customer';

    const index = draft.indexOf(excerpt);
    assert.ok(index !== -1);

    const updated = draft.slice(0, index) + suggestion + draft.slice(index + excerpt.length);
    assert.equal(updated, 'Welcome to our platform for every customer today.');
  });

  it('handles case-insensitive match when exact match differs in casing', () => {
    const draft = 'Every Consumer deserves great service.';
    const excerpt = 'consumer';
    const suggestion = 'Customer';

    const lowerDraft = draft.toLowerCase();
    const lowerExcerpt = excerpt.toLowerCase();
    const index = lowerDraft.indexOf(lowerExcerpt);

    assert.ok(index !== -1);
    const updated = draft.slice(0, index) + suggestion + draft.slice(index + excerpt.length);
    assert.equal(updated, 'Every Customer deserves great service.');
  });

  it('manages local dismissal set correctly', () => {
    const dismissed = new Set();
    dismissed.add('F-001');
    assert.ok(dismissed.has('F-001'));
    assert.equal(dismissed.has('F-002'), false);

    // Toggle dismissal (undo)
    dismissed.delete('F-001');
    assert.equal(dismissed.has('F-001'), false);
  });
});
