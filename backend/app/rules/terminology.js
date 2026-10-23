function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Adapt the casing of replacement to match the matched excerpt.
 * E.g., 'Consumer' -> 'Customer', 'CONSUMER' -> 'CUSTOMER', 'consumer' -> 'customer'
 */
function adaptCasing(originalExcerpt, replacement) {
  if (!originalExcerpt || !replacement) return replacement;
  if (originalExcerpt === originalExcerpt.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (originalExcerpt[0] === originalExcerpt[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Checks draft text against approved terminology rules.
 *
 * Rules:
 * - Word-boundary-aware matching (\bterm\b).
 * - Avoids false positives on substrings of longer words (e.g. 'consumer' does not match 'proconsumerism').
 * - Preserves original draft excerpt.
 * - Produces case-appropriate suggestions.
 * - Prevents duplicate findings for the same location and rule.
 *
 * @param {string} draftText
 * @param {Array<{id: string, preferred: string, avoid: string[]}>} approvedTerms
 * @returns {Array<object>} List of raw terminology findings
 */
export function checkTerminology(draftText, approvedTerms = []) {
  if (!draftText || !approvedTerms || approvedTerms.length === 0) {
    return [];
  }

  const findings = [];
  const seenOccurrences = new Set();
  let counter = 1;

  for (const rule of approvedTerms) {
    if (!rule.avoid || !Array.isArray(rule.avoid)) continue;

    for (const avoidTerm of rule.avoid) {
      if (!avoidTerm || typeof avoidTerm !== 'string') continue;
      const trimmedTerm = avoidTerm.trim();
      if (!trimmedTerm) continue;

      // Word boundary regex:
      // If term starts/ends with alphanumeric characters, apply \b, otherwise handle punctuation boundaries safely
      const escaped = escapeRegex(trimmedTerm);
      const startsWithWord = /^\w/.test(trimmedTerm);
      const endsWithWord = /\w$/.test(trimmedTerm);

      const pattern = `${startsWithWord ? '\\b' : '(?<=\\s|^|[^\x00-\x7F])'}${escaped}${endsWithWord ? '\\b' : '(?=\\s|$|[^\x00-\x7F])'}`;
      const regex = new RegExp(pattern, 'gi');

      let match;
      while ((match = regex.exec(draftText)) !== null) {
        const startIndex = match.index;
        const matchedExcerpt = match[0];
        const occurrenceKey = `${rule.id}:${startIndex}:${matchedExcerpt.toLowerCase()}`;

        if (seenOccurrences.has(occurrenceKey)) {
          continue;
        }
        seenOccurrences.add(occurrenceKey);

        const suggestion = adaptCasing(matchedExcerpt, rule.preferred);

        findings.push({
          id: `TERM-${String(counter++).padStart(3, '0')}`,
          category: 'Terminology',
          severity: 'Low',
          excerpt: matchedExcerpt,
          explanation: `The supplied terminology rules prefer '${rule.preferred}' over '${matchedExcerpt}'.`,
          suggestion: suggestion,
          evidence_ids: [rule.id],
          confidence: 'high',
          _startIndex: startIndex
        });
      }
    }
  }

  // Sort findings by position in text for deterministic ordering
  findings.sort((a, b) => (a._startIndex ?? 0) - (b._startIndex ?? 0));

  // Clean internal tracking fields
  return findings.map(({ _startIndex, ...finding }) => finding);
}

export default {
  checkTerminology
};
