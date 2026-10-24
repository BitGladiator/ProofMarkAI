import React, { useState, useMemo } from 'react';
import { useRouter } from '../router';
import {
  ShieldLogoIcon,
  SparklesIcon,
  CheckIcon
} from '../components/Icons';
import { submitReview, ApiError } from '../api/client';
import {
  ReviewResponse,
  Finding,
  BrandGuideline,
  ApprovedTerm,
  ApprovedFact,
  ReviewRequest,
  FindingCategory
} from '../types';
import {
  SAMPLE_DRAFT,
  DEFAULT_BRAND_GUIDELINES,
  DEFAULT_APPROVED_TERMS,
  DEFAULT_APPROVED_FACTS
} from '../data/samples';

interface ReviewWorkspacePageProps {
  backendStatus: 'checking' | 'connected' | 'disconnected';
  onRetryConnection: () => void;
}

export const ReviewWorkspacePage: React.FC<ReviewWorkspacePageProps> = ({
  backendStatus,
  onRetryConnection
}) => {
  const { navigate } = useRouter();

  // Editor and review states
  const [draftText, setDraftText] = useState<string>('');
  const [lastReviewedDraft, setLastReviewedDraft] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [reviewResult, setReviewResult] = useState<ReviewResponse | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [dismissedFindingIds, setDismissedFindingIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Brand standards settings
  const [useBundledProfile, setUseBundledProfile] = useState<boolean>(true);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'terms' | 'guidelines' | 'facts'>('terms');

  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuideline[]>(DEFAULT_BRAND_GUIDELINES);
  const [approvedTerms, setApprovedTerms] = useState<ApprovedTerm[]>(DEFAULT_APPROVED_TERMS);
  const [approvedFacts, setApprovedFacts] = useState<ApprovedFact[]>(DEFAULT_APPROVED_FACTS);

  const [guidelinesJson, setGuidelinesJson] = useState(JSON.stringify(DEFAULT_BRAND_GUIDELINES, null, 2));
  const [termsJson, setTermsJson] = useState(JSON.stringify(DEFAULT_APPROVED_TERMS, null, 2));
  const [factsJson, setFactsJson] = useState(JSON.stringify(DEFAULT_APPROVED_FACTS, null, 2));
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const maxDraftLength = 20000;
  const isDraftEmpty = draftText.trim().length === 0;
  const isOverLimit = draftText.length > maxDraftLength;

  // Determine if draft has been modified since the last review
  const isDraftModified =
    lastReviewedDraft !== null &&
    reviewResult !== null &&
    draftText.trim() !== lastReviewedDraft.trim();

  // Determine current workflow step
  const currentStep = useMemo(() => {
    if (isReviewing) return 2;
    if (reviewResult !== null) return 3;
    if (!isDraftEmpty) return 1;
    return 1;
  }, [isReviewing, reviewResult, isDraftEmpty]);

  // Load sample draft
  const handleLoadSample = () => {
    setDraftText(SAMPLE_DRAFT);
    setReviewError(null);
  };

  // Clear draft action with confirmation
  const handleClearDraft = () => {
    if (draftText.trim().length > 30) {
      const confirmed = window.confirm(
        'Are you sure you want to clear your draft? Unsaved edits will be lost.'
      );
      if (!confirmed) return;
    }
    setDraftText('');
    setLastReviewedDraft(null);
    setReviewResult(null);
    setReviewError(null);
    setDismissedFindingIds(new Set());
  };

  // Run review action
  const handleExecuteReview = async () => {
    if (isDraftEmpty || isOverLimit) return;

    setIsReviewing(true);
    setReviewError(null);

    const payload: ReviewRequest = {
      draft_text: draftText
    };

    if (!useBundledProfile) {
      payload.brand_guidelines = brandGuidelines;
      payload.approved_terms = approvedTerms;
      payload.approved_facts = approvedFacts;
    }

    try {
      const response = await submitReview(payload);
      setReviewResult(response);
      setLastReviewedDraft(draftText);
      setDismissedFindingIds(new Set());
      setSelectedCategory('All');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setReviewError(err.message);
      } else {
        setReviewError((err as Error).message || 'An error occurred during content review.');
      }
    } finally {
      setIsReviewing(false);
    }
  };

  // Accept a suggestion: replace occurrence in the draft editor
  const handleAcceptSuggestion = (finding: Finding) => {
    if (!finding.suggestion || !finding.excerpt) return;

    const excerpt = finding.excerpt;
    const suggestion = finding.suggestion;

    // Search exact match
    const exactIndex = draftText.indexOf(excerpt);
    if (exactIndex !== -1) {
      const updated =
        draftText.slice(0, exactIndex) +
        suggestion +
        draftText.slice(exactIndex + excerpt.length);
      setDraftText(updated);
      setDismissedFindingIds((prev) => new Set(prev).add(finding.id));
      return;
    }

    // Search case-insensitive match
    const lowerDraft = draftText.toLowerCase();
    const lowerExcerpt = excerpt.toLowerCase();
    const lowerIndex = lowerDraft.indexOf(lowerExcerpt);

    if (lowerIndex !== -1) {
      const updated =
        draftText.slice(0, lowerIndex) +
        suggestion +
        draftText.slice(lowerIndex + excerpt.length);
      setDraftText(updated);
      setDismissedFindingIds((prev) => new Set(prev).add(finding.id));
      return;
    }

    alert(
      `Could not locate "${excerpt}" in current text. You can manually insert: "${suggestion}".`
    );
  };

  // Toggle dismissal of a finding
  const handleToggleDismiss = (id: string) => {
    setDismissedFindingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Reset custom settings to sample defaults
  const handleResetSettings = () => {
    setBrandGuidelines(DEFAULT_BRAND_GUIDELINES);
    setApprovedTerms(DEFAULT_APPROVED_TERMS);
    setApprovedFacts(DEFAULT_APPROVED_FACTS);
    setGuidelinesJson(JSON.stringify(DEFAULT_BRAND_GUIDELINES, null, 2));
    setTermsJson(JSON.stringify(DEFAULT_APPROVED_TERMS, null, 2));
    setFactsJson(JSON.stringify(DEFAULT_APPROVED_FACTS, null, 2));
    setSettingsError(null);
  };

  // Update JSON handlers
  const handleUpdateGuidelines = (val: string) => {
    setGuidelinesJson(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) throw new Error('Must be an array of guidelines');
      setBrandGuidelines(parsed);
      setSettingsError(null);
    } catch (e: unknown) {
      setSettingsError((e as Error).message);
    }
  };

  const handleUpdateTerms = (val: string) => {
    setTermsJson(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) throw new Error('Must be an array of terminology rules');
      setApprovedTerms(parsed);
      setSettingsError(null);
    } catch (e: unknown) {
      setSettingsError((e as Error).message);
    }
  };

  const handleUpdateFacts = (val: string) => {
    setFactsJson(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) throw new Error('Must be an array of approved facts');
      setApprovedFacts(parsed);
      setSettingsError(null);
    } catch (e: unknown) {
      setSettingsError((e as Error).message);
    }
  };

  // Filter findings
  const findings = reviewResult?.findings || [];
  const categories: FindingCategory[] = ['Terminology', 'Tone', 'Claims', 'FactualConsistency'];
  const presentCategories = Array.from(new Set(findings.map((f) => f.category)));

  const filteredFindings = findings.filter((f) => {
    if (selectedCategory === 'All') return true;
    return f.category === selectedCategory;
  });

  const activeCount = findings.filter((f) => !dismissedFindingIds.has(f.id)).length;
  const dismissedCount = findings.filter((f) => dismissedFindingIds.has(f.id)).length;

  return (
    <div className="workspace-wrapper">
      {/* 1. Workspace Header */}
      <header className="workspace-header">
        <div className="workspace-nav-container">
          <div className="workspace-brand-row">
            <div
              className="logo-group"
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
              title="Return to homepage"
            >
              <ShieldLogoIcon size={24} />
              <span className="brand-name">ProofMark AI</span>
            </div>
            <span className="workspace-tag">Review Workspace</span>
          </div>

          <div className="workspace-actions-row">
            <button
              type="button"
              className="btn-text-nav"
              onClick={() => navigate('/')}
            >
              ← Back to home
            </button>

            <div className="status-pill-wrap">
              {backendStatus === 'connected' && (
                <span className="status-pill connected" title="Backend service is operational">
                  <span className="status-dot"></span>
                  Connected
                </span>
              )}
              {backendStatus === 'disconnected' && (
                <span className="status-pill disconnected" title="Backend service is offline">
                  <span className="status-dot"></span>
                  Disconnected
                  <button
                    type="button"
                    className="status-retry-link"
                    onClick={onRetryConnection}
                  >
                    Retry
                  </button>
                </span>
              )}
              {backendStatus === 'checking' && (
                <span className="status-pill checking">
                  <span className="status-dot"></span>
                  Checking...
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Workspace Body */}
      <main className="workspace-main">
        {/* Workspace Intro & Step Progress */}
        <div className="workspace-intro-row">
          <div>
            <h1 className="workspace-title">Review your content</h1>
            <p className="workspace-subtitle">
              Audit drafts against brand guidelines, terminology rules, and approved corporate facts.
            </p>
          </div>

          {/* Visual Step Guide */}
          <div className="step-tracker" aria-label="Review progress steps">
            <div className={`tracker-step ${currentStep >= 1 ? 'active' : ''}`}>
              <span className="step-circle">1</span>
              <span className="step-label">Draft</span>
            </div>
            <div className={`tracker-line ${currentStep >= 2 ? 'active' : ''}`}></div>
            <div className={`tracker-step ${currentStep >= 2 ? 'active' : ''}`}>
              <span className="step-circle">2</span>
              <span className="step-label">Review</span>
            </div>
            <div className={`tracker-line ${currentStep >= 3 ? 'active' : ''}`}></div>
            <div className={`tracker-step ${currentStep >= 3 ? 'active' : ''}`}>
              <span className="step-circle">3</span>
              <span className="step-label">Refine</span>
            </div>
          </div>
        </div>

        {/* 3. Two-Column Workspace Layout */}
        <div className="workspace-grid">
          {/* Left Column: Draft Editor & Reference Settings */}
          <div className="workspace-left-col">
            <div className="panel editor-panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <h2 className="panel-title">Draft content</h2>
                  {isDraftModified && (
                    <span className="badge-modified" title="Draft has been modified since last review">
                      • Edited since last review
                    </span>
                  )}
                </div>

                <div className="editor-button-group">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={handleLoadSample}
                    disabled={isReviewing}
                    title="Insert realistic sample draft containing deliberate brand issues"
                  >
                    Load sample
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={handleClearDraft}
                    disabled={isReviewing || isDraftEmpty}
                    title="Clear current editor content"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                id="draft-editor-textarea"
                className="draft-textarea"
                placeholder="Paste marketing copy, product announcements, email drafts, or web text here..."
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                disabled={isReviewing}
                aria-label="Draft copy to review"
              />

              <div className="draft-meta-bar">
                <span
                  className="char-count"
                  style={{
                    color: isOverLimit ? 'var(--danger)' : undefined,
                    fontWeight: isOverLimit ? 600 : 400
                  }}
                >
                  {draftText.length.toLocaleString()} / {maxDraftLength.toLocaleString()} characters
                </span>
                <span className="length-note">Max 20,000 chars</span>
              </div>

              <button
                type="button"
                className="btn-primary btn-review-action"
                onClick={handleExecuteReview}
                disabled={isDraftEmpty || isOverLimit || isReviewing}
              >
                {isReviewing ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    Running brand review...
                  </>
                ) : (
                  <>
                    <SparklesIcon size={18} />
                    {lastReviewedDraft && isDraftModified ? 'Review updated draft' : 'Review content'}
                  </>
                )}
              </button>
            </div>

            {/* Brand Settings & Reference Standards */}
            <div className="panel settings-panel">
              <button
                type="button"
                className="settings-toggle-head"
                onClick={() => setSettingsOpen(!settingsOpen)}
                aria-expanded={settingsOpen}
              >
                <div className="settings-toggle-title">
                  <span className="font-semibold">Brand Standards &amp; Reference Rules</span>
                  <span className="settings-count-pill">
                    {useBundledProfile
                      ? 'Bundled defaults (4 terms • 3 voice • 4 facts)'
                      : `Custom (${approvedTerms.length} terms • ${brandGuidelines.length} voice • ${approvedFacts.length} facts)`}
                  </span>
                </div>
                <span className="toggle-indicator">{settingsOpen ? '▲ Hide' : '▼ Customize'}</span>
              </button>

              {settingsOpen && (
                <div className="settings-expandable-body">
                  <div className="profile-mode-selector">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="profile-mode"
                        checked={useBundledProfile}
                        onChange={() => setUseBundledProfile(true)}
                        disabled={isReviewing}
                      />
                      <span>Use bundled sample profile (standard defaults)</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="profile-mode"
                        checked={!useBundledProfile}
                        onChange={() => setUseBundledProfile(false)}
                        disabled={isReviewing}
                      />
                      <span>Custom reference rules</span>
                    </label>
                  </div>

                  {!useBundledProfile && (
                    <div className="custom-rules-workspace">
                      <div className="settings-tabs-row">
                        <button
                          type="button"
                          className={`settings-tab-btn ${settingsTab === 'terms' ? 'active' : ''}`}
                          onClick={() => setSettingsTab('terms')}
                        >
                          Terminology ({approvedTerms.length})
                        </button>
                        <button
                          type="button"
                          className={`settings-tab-btn ${settingsTab === 'guidelines' ? 'active' : ''}`}
                          onClick={() => setSettingsTab('guidelines')}
                        >
                          Voice Guidelines ({brandGuidelines.length})
                        </button>
                        <button
                          type="button"
                          className={`settings-tab-btn ${settingsTab === 'facts' ? 'active' : ''}`}
                          onClick={() => setSettingsTab('facts')}
                        >
                          Approved Facts ({approvedFacts.length})
                        </button>
                      </div>

                      {settingsTab === 'terms' && (
                        <div>
                          <textarea
                            className="json-textarea"
                            value={termsJson}
                            onChange={(e) => handleUpdateTerms(e.target.value)}
                            disabled={isReviewing}
                            placeholder='[{"id":"TERM-01","preferred":"customer","avoid":["consumer"]}]'
                          />
                          <p className="settings-tab-helper">
                            Format: array of objects with <code>id</code>, <code>preferred</code> (string), and <code>avoid</code> (array of strings).
                          </p>
                        </div>
                      )}

                      {settingsTab === 'guidelines' && (
                        <div>
                          <textarea
                            className="json-textarea"
                            value={guidelinesJson}
                            onChange={(e) => handleUpdateGuidelines(e.target.value)}
                            disabled={isReviewing}
                            placeholder='[{"id":"VOICE-01","text":"Clear, friendly, and professional language."}]'
                          />
                          <p className="settings-tab-helper">
                            Format: array of objects with <code>id</code> and <code>text</code> description.
                          </p>
                        </div>
                      )}

                      {settingsTab === 'facts' && (
                        <div>
                          <textarea
                            className="json-textarea"
                            value={factsJson}
                            onChange={(e) => handleUpdateFacts(e.target.value)}
                            disabled={isReviewing}
                            placeholder='[{"id":"FACT-01","text":"Service is available in 10 regions."}]'
                          />
                          <p className="settings-tab-helper">
                            Format: array of verified facts with <code>id</code> and <code>text</code>.
                          </p>
                        </div>
                      )}

                      {settingsError && (
                        <div className="settings-error-notice">
                          JSON syntax error: {settingsError}
                        </div>
                      )}

                      <div className="settings-reset-row">
                        <button
                          type="button"
                          className="btn-text-sm"
                          onClick={handleResetSettings}
                        >
                          Reset to sample defaults
                        </button>
                      </div>
                    </div>
                  )}

                  {useBundledProfile && (
                    <p className="bundled-info-text">
                      The backend resolves standard brand standards from its bundled data: 4 terminology rules (e.g. customer vs. consumer), 3 voice guidelines (clarity, respectful tone, brand honesty), and 4 verified corporate facts.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Review Findings & Summary */}
          <div className="workspace-right-col">
            <div className="panel findings-panel">
              {/* Header of Findings Panel */}
              <div className="findings-panel-head">
                <h2 className="panel-title">Review findings</h2>
                {reviewResult && (
                  <span className="findings-count-badge">
                    {activeCount} active{dismissedCount > 0 ? `, ${dismissedCount} dismissed` : ''}
                  </span>
                )}
              </div>

              {/* 1. Reviewing / Loading state */}
              {isReviewing && (
                <div className="findings-loading-state">
                  <div className="spinner large" aria-hidden="true"></div>
                  <h3 className="loading-title">Analyzing draft content...</h3>
                  <p className="loading-desc">
                    Running word-boundary terminology checks, evaluating tone against guidelines, and auditing claims against verified facts.
                  </p>
                </div>
              )}

              {/* 2. Error state */}
              {!isReviewing && reviewError && (
                <div className="findings-error-state">
                  <div className="alert-error-box">
                    <strong>Review request failed</strong>
                    <p>{reviewError}</p>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={handleExecuteReview}
                    >
                      Retry review
                    </button>
                  </div>
                  <p className="error-fallback-note">
                    Your draft content remains safely preserved in the editor.
                  </p>
                </div>
              )}

              {/* 3. Initial State (No review run yet) */}
              {!isReviewing && !reviewError && !reviewResult && (
                <div className="findings-empty-state">
                  <div className="empty-state-icon">
                    <ShieldLogoIcon size={38} />
                  </div>
                  <h3 className="empty-title">Ready for your review</h3>
                  <p className="empty-desc">
                    Enter or paste copy into the editor, then click &ldquo;Review content&rdquo; to scan for terminology violations, voice deviations, and unverified claims.
                  </p>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={handleLoadSample}
                  >
                    Load sample draft to test
                  </button>
                </div>
              )}

              {/* 4. Zero findings state */}
              {!isReviewing && !reviewError && reviewResult && findings.length === 0 && (
                <div className="findings-zero-state">
                  <div className="zero-icon-bubble">
                    <CheckIcon size={24} />
                  </div>
                  <h3 className="zero-title">No issues identified</h3>
                  <p className="zero-desc">
                    {reviewResult.review_summary ||
                      'The review completed with 0 issues identified. Content aligns with provided reference standards.'}
                  </p>
                  {reviewResult.review_status?.details && (
                    <div className="status-meta-note">
                      <strong>Check status:</strong> {reviewResult.review_status.details}
                    </div>
                  )}
                  <div className="human-review-note">
                    <strong>Human Review Required:</strong> Automated checks assist human reviewers but do not make final approval decisions.
                  </div>
                </div>
              )}

              {/* 5. Findings List & Actions */}
              {!isReviewing && !reviewError && reviewResult && findings.length > 0 && (
                <div className="findings-content">
                  {/* Summary & Human Review Tag */}
                  <div className="summary-header-card">
                    <div className="summary-title-row">
                      <span className="summary-text">{reviewResult.review_summary}</span>
                    </div>

                    <div className="summary-tags-row">
                      <span className="tag-human-review">
                        Human review required
                      </span>

                      {reviewResult.review_status && (
                        <span className="tag-engine-status">
                          Rules: {reviewResult.review_status.terminology_check} • AI: {reviewResult.review_status.ai_review_check}
                        </span>
                      )}
                    </div>

                    {reviewResult.review_status?.details && (
                      <div className="status-details-callout">
                        {reviewResult.review_status.details}
                      </div>
                    )}
                  </div>

                  {/* Filter chips */}
                  <div className="filter-chips-bar">
                    <button
                      type="button"
                      className={`chip-btn ${selectedCategory === 'All' ? 'active' : ''}`}
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
                          className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(cat)}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Findings Cards List */}
                  <div className="finding-cards-list">
                    {filteredFindings.map((finding) => {
                      const isDismissed = dismissedFindingIds.has(finding.id);
                      const severityClass =
                        finding.severity.toLowerCase() === 'high'
                          ? 'sev-high'
                          : finding.severity.toLowerCase() === 'medium'
                          ? 'sev-med'
                          : 'sev-low';

                      return (
                        <div
                          key={finding.id}
                          className={`finding-card ${isDismissed ? 'dismissed' : ''}`}
                        >
                          <div className="finding-card-head">
                            <div className="finding-badges-group">
                              <span className="badge-cat">{finding.category}</span>
                              <span className={`badge-sev ${severityClass}`}>{finding.severity}</span>
                              <span className="badge-conf">Confidence: {finding.confidence}</span>
                            </div>
                            <span className="finding-id-tag">{finding.id}</span>
                          </div>

                          {finding.excerpt && (
                            <div className="finding-excerpt-block">
                              <span className="excerpt-quote">&ldquo;{finding.excerpt}&rdquo;</span>
                            </div>
                          )}

                          <p className="finding-explanation-text">
                            {finding.explanation}
                          </p>

                          {finding.suggestion && (
                            <div className="finding-suggestion-box">
                              <div className="suggestion-info">
                                <span className="suggestion-prefix">Suggested rewrite:</span>
                                <span className="suggestion-val">&ldquo;{finding.suggestion}&rdquo;</span>
                              </div>
                              {!isDismissed && (
                                <button
                                  type="button"
                                  className="btn-accept-suggestion"
                                  onClick={() => handleAcceptSuggestion(finding)}
                                  title="Replace excerpt with suggestion in editor"
                                >
                                  Accept suggestion
                                </button>
                              )}
                            </div>
                          )}

                          <div className="finding-card-footer">
                            <div className="evidence-ids-list">
                              {finding.evidence_ids && finding.evidence_ids.length > 0 && (
                                <>
                                  <span className="evidence-label">Evidence:</span>
                                  {finding.evidence_ids.map((id) => (
                                    <span key={id} className="evidence-code">
                                      {id}
                                    </span>
                                  ))}
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              className="btn-dismiss-action"
                              onClick={() => handleToggleDismiss(finding.id)}
                            >
                              {isDismissed ? 'Undo dismiss' : 'Dismiss'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
