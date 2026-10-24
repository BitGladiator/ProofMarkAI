import React, { useState } from 'react';
import { Finding, ReviewResponse, FindingCategory } from '../types';

interface FindingsListProps {
  reviewResult: ReviewResponse | null;
  isReviewing: boolean;
  error: string | null;
  onRetry: () => void;
  onAcceptSuggestion: (finding: Finding) => void;
  dismissedFindingIds: Set<string>;
  onToggleDismissFinding: (id: string) => void;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  reviewResult,
  isReviewing,
  error,
  onRetry,
  onAcceptSuggestion,
  dismissedFindingIds,
  onToggleDismissFinding
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Loading state
  if (isReviewing) {
    return (
      <div className="panel findings-panel">
        <div className="panel-title">Review findings</div>
        <div className="empty-state">
          <div className="spinner" style={{ borderColor: 'rgba(37,99,235,0.2)', borderTopColor: 'var(--primary)', width: 24, height: 24, margin: '0 auto 1rem' }}></div>
          <div className="empty-state-title">Analyzing draft content...</div>
          <div className="empty-state-desc">
            Evaluating terminology against approved vocabulary, checking tone guidelines, and cross-referencing verified facts.
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="panel findings-panel">
        <div className="panel-title">Review findings</div>
        <div className="alert-error">
          <div className="alert-error-content">
            <span className="alert-error-title">Review request failed</span>
            <span>{error}</span>
          </div>
          <button type="button" className="btn-secondary" onClick={onRetry}>
            Retry review
          </button>
        </div>
        <div className="empty-state">
          <div className="empty-state-desc">
            Your draft content was preserved. Check backend connectivity and try again.
          </div>
        </div>
      </div>
    );
  }

  // Initial state (no review run yet)
  if (!reviewResult) {
    return (
      <div className="panel findings-panel">
        <div className="panel-title">Review findings</div>
        <div className="empty-state">
          <div className="empty-state-title">No review completed yet</div>
          <div className="empty-state-desc">
            Enter draft marketing or communication copy in the editor and click &ldquo;Review content&rdquo; to scan for compliance issues.
          </div>
        </div>
      </div>
    );
  }

  const { findings, review_summary, needs_human_review, review_status } = reviewResult;

  // Zero findings state
  if (findings.length === 0) {
    return (
      <div className="panel findings-panel">
        <div className="panel-title">Review findings</div>
        <div className="zero-issues-card">
          <div className="zero-issues-title">No issues identified</div>
          <div className="zero-issues-desc">
            {review_summary || 'No issues were identified in this review. Content aligns with provided references.'}
          </div>
        </div>
        {review_status?.details && (
          <div className="status-details-note">
            <strong>Check status:</strong> {review_status.details}
          </div>
        )}
      </div>
    );
  }

  // Available categories for filter
  const categories: FindingCategory[] = [
    'Terminology',
    'Tone',
    'Claims',
    'FactualConsistency'
  ];
  const presentCategories = Array.from(new Set(findings.map((f) => f.category)));

  const filteredFindings = findings.filter((f) => {
    if (selectedCategory === 'All') return true;
    return f.category === selectedCategory;
  });

  const activeCount = findings.filter((f) => !dismissedFindingIds.has(f.id)).length;
  const dismissedCount = findings.filter((f) => dismissedFindingIds.has(f.id)).length;

  return (
    <div className="panel findings-panel">
      <div className="findings-header">
        <div className="summary-banner">
          {review_summary}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {needs_human_review && (
            <span className="human-review-note" title="AI suggestions assist human reviewers but do not make final approval decisions">
              Human review required
            </span>
          )}
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            ({activeCount} active{dismissedCount > 0 ? `, ${dismissedCount} dismissed` : ''})
          </span>
        </div>

        {review_status && (
          <div className="status-details-note">
            <strong>Engine Status:</strong> Terminology ({review_status.terminology_check}) • AI Tone/Claims ({review_status.ai_review_check})
            {review_status.details && <span> — {review_status.details}</span>}
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div className="filter-bar">
        <button
          type="button"
          className={`filter-chip ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('All')}
        >
          All ({findings.length})
        </button>
        {categories.map((cat) => {
          const count = findings.filter((f) => f.category === cat).length;
          if (count === 0 && !presentCategories.includes(cat)) return null;
          return (
            <button
              key={cat}
              type="button"
              className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Finding cards */}
      <div className="finding-list">
        {filteredFindings.map((finding) => {
          const isDismissed = dismissedFindingIds.has(finding.id);
          const severityClass =
            finding.severity.toLowerCase() === 'high'
              ? 'badge-high'
              : finding.severity.toLowerCase() === 'medium'
              ? 'badge-medium'
              : 'badge-low';

          return (
            <div
              key={finding.id}
              className={`finding-card ${isDismissed ? 'dismissed' : ''}`}
            >
              <div className="finding-top">
                <div className="finding-meta">
                  <span className="badge badge-category">{finding.category}</span>
                  <span className={`badge ${severityClass}`}>{finding.severity}</span>
                  <span className="badge-confidence">Confidence: {finding.confidence}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                  {finding.id}
                </span>
              </div>

              {finding.excerpt && (
                <div className="finding-excerpt" title="Flagged excerpt from draft">
                  &ldquo;{finding.excerpt}&rdquo;
                </div>
              )}

              <div className="finding-explanation">
                {finding.explanation}
              </div>

              {finding.suggestion && (
                <div className="suggestion-box">
                  <span className="suggestion-text">
                    <span className="suggestion-label">Suggested:</span>
                    &ldquo;{finding.suggestion}&rdquo;
                  </span>
                  {!isDismissed && (
                    <button
                      type="button"
                      className="btn-accept"
                      onClick={() => onAcceptSuggestion(finding)}
                      title="Replace excerpt with suggested text in the editor"
                    >
                      Accept suggestion
                    </button>
                  )}
                </div>
              )}

              {finding.evidence_ids && finding.evidence_ids.length > 0 && (
                <div className="evidence-tags">
                  <span>Evidence:</span>
                  {finding.evidence_ids.map((id) => (
                    <span key={id} className="evidence-id">
                      {id}
                    </span>
                  ))}
                </div>
              )}

              <div className="finding-actions">
                <button
                  type="button"
                  className="btn-dismiss"
                  onClick={() => onToggleDismissFinding(finding.id)}
                >
                  {isDismissed ? 'Undo dismiss' : 'Dismiss'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
