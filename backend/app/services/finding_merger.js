/**
 * Merges deterministic and AI-generated findings, removing genuine duplicates
 * while preserving distinct issues across different categories or excerpts.
 * Re-indexes all findings to the canonical format (F-001, F-002, etc.).
 *
 * @param {Array} deterministicFindings
 * @param {Array} aiFindings
 * @returns {Array} Clean merged findings with canonical IDs
 */
export function mergeFindings(deterministicFindings = [], aiFindings = []) {
  const merged = [];
  const seenSignatures = new Set();

  function makeSignature(finding) {
    const normExcerpt = (finding.excerpt || '').trim().toLowerCase();
    const category = (finding.category || '').toLowerCase();
    return `${category}:${normExcerpt}`;
  }

  // Add deterministic findings first (they are authoritative for terminology)
  for (const f of deterministicFindings) {
    const sig = makeSignature(f);
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      merged.push({ ...f });
    }
  }

  // Add AI findings if not duplicate
  for (const f of aiFindings) {
    const sig = makeSignature(f);
    if (seenSignatures.has(sig)) {
      // If same excerpt & category already captured by deterministic check, don't duplicate
      continue;
    }
    seenSignatures.add(sig);
    merged.push({ ...f });
  }

  // Re-index all findings to canonical IDs: F-001, F-002, ...
  return merged.map((item, index) => ({
    id: `F-${String(index + 1).padStart(3, '0')}`,
    category: item.category,
    severity: item.severity,
    excerpt: item.excerpt,
    explanation: item.explanation,
    suggestion: item.suggestion || null,
    evidence_ids: Array.isArray(item.evidence_ids) ? item.evidence_ids : [],
    confidence: item.confidence
  }));
}

/**
 * Generates a human-friendly review summary from the findings.
 *
 * @param {Array} findings
 * @returns {string}
 */
export function generateReviewSummary(findings) {
  const count = findings.length;
  if (count === 0) {
    return 'Review completed with 0 issues identified. Content aligns with provided references.';
  }
  const issueWord = count === 1 ? 'potential issue' : 'potential issues';
  return `Review completed with ${count} ${issueWord}.`;
}

export default {
  mergeFindings,
  generateReviewSummary
};
