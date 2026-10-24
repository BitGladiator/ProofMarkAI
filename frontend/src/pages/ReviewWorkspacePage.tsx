import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from '../router';
import {
  ShieldLogoIcon,
  SparklesIcon
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

  // Stale request guard
  const latestReviewIdRef = useRef<number>(0);

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

  // Word count helper
  const wordCount = useMemo(() => {
    const trimmed = draftText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [draftText]);

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
        'Clear your draft? Unsaved edits will be lost.'
      );
      if (!confirmed) return;
    }
    setDraftText('');
    setLastReviewedDraft(null);
    setReviewResult(null);
    setReviewError(null);
    setDismissedFindingIds(new Set());
  };

  // Run review action with concurrency guard
  const handleExecuteReview = async () => {
    if (isDraftEmpty || isOverLimit || isReviewing) return;

    const reviewId = ++latestReviewIdRef.current;
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
      if (reviewId === latestReviewIdRef.current) {
        setReviewResult(response);
        setLastReviewedDraft(draftText);
        setDismissedFindingIds(new Set());
        setSelectedCategory('All');
      }
    } catch (err: unknown) {
      if (reviewId === latestReviewIdRef.current) {
        if (err instanceof ApiError) {
          setReviewError(err.message);
        } else {
          setReviewError((err as Error).message || 'An error occurred during content review.');
        }
      }
    } finally {
      if (reviewId === latestReviewIdRef.current) {
        setIsReviewing(false);
      }
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
      {/* 1. Header Bar */}
      <header className="editorial-header">
        <div className="nav-inner">
          <div
            className="brand-mark"
            onClick={() => navigate('/')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/');
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="ProofMark AI Home"
          >
            <ShieldLogoIcon className="brand-logo-icon" size={26} />
            <span className="brand-title">ProofMark AI</span>
          </div>

          <div className="nav-actions">
            <div className="status-pill-wrap" title="Engine Connection Status">
              {backendStatus === 'connected' && (
                <span className="status-pill connected" title="Engine Online">
                  <span className="status-dot"></span>
                  <span className="status-label-full">Engine Online</span>
                  <span className="status-label-mobile">Online</span>
                </span>
              )}
              {backendStatus === 'disconnected' && (
                <span className="status-pill disconnected" title="Engine Offline">
                  <span className="status-dot"></span>
                  <span className="status-label-full">Engine Offline</span>
                  <span className="status-label-mobile">Offline</span>
                  <button
                    type="button"
                    className="status-retry-link"
                    onClick={onRetryConnection}
                    title="Retry connection"
                  >
                    Retry
                  </button>
                </span>
              )}
              {backendStatus === 'checking' && (
                <span className="status-pill checking" title="Connecting to Review Engine...">
                  <span className="status-dot"></span>
                  <span className="status-label-full">Checking...</span>
                  <span className="status-label-mobile">Checking</span>
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn-secondary nav-return-btn"
              onClick={() => navigate('/')}
            >
              <span className="btn-text-full">&larr; Return Home</span>
              <span className="btn-text-mobile">&larr; Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Workspace Body */}
      <main className="workspace-main-content">
        {/* Desk Meta & Controls Row */}
        <div className="workspace-meta-row">
          <div className="desk-title-group">
            <h1 className="desk-headline">The Brand Standards Desk</h1>
            <span className="desk-caption">
              Step {currentStep} of 3: {currentStep === 1 ? 'Prepare Manuscript' : currentStep === 2 ? 'Audit in Progress' : 'Review Editorial Findings'}
            </span>
          </div>

          <div className="workspace-controls-group">
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              onClick={handleLoadSample}
            >
              Load Sample Copy
            </button>

            {draftText && (
              <button
                type="button"
                className="btn-text"
                style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}
                onClick={handleClearDraft}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Workspace Grid */}
        <div className="workspace-grid">
          {/* Left Column: Draft Manuscript Editor */}
          <div className="manuscript-panel">
            <div className="panel-header-row">
              <span className="panel-heading">SECTION 01: DRAFT MANUSCRIPT</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isDraftModified && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--warning)', background: 'var(--warning-light)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-xs)' }}>
                    Edited since last audit
                  </span>
                )}
              </div>
            </div>

            <textarea
              className="manuscript-textarea"
              placeholder="Paste your draft marketing, announcement, or communication copy here for review..."
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              disabled={isReviewing}
              aria-label="Draft text editor"
            />

            <div className="editor-meta-bar">
              <span>{wordCount} words • {draftText.length.toLocaleString()} characters</span>
              <span style={{ color: isOverLimit ? 'var(--danger)' : 'var(--text-subtle)' }}>
                Limit: {maxDraftLength.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              className="btn-primary btn-block"
              style={{ marginTop: '1rem', padding: '0.75rem' }}
              onClick={handleExecuteReview}
              disabled={isDraftEmpty || isOverLimit || isReviewing}
            >
              {isReviewing ? (
                <>
                  <SparklesIcon size={16} /> Auditing with Groq Cloud AI...
                </>
              ) : isDraftModified ? (
                <>
                  <SparklesIcon size={16} /> Re-Run Brand Review
                </>
              ) : (
                <>
                  <SparklesIcon size={16} /> Run Brand Review
                </>
              )}
            </button>

            {/* Brand Guidelines & Reference Standards Accordion */}
            <div className="standards-accordion">
              <button
                type="button"
                className="accordion-trigger-btn"
                onClick={() => setSettingsOpen(!settingsOpen)}
                aria-expanded={settingsOpen}
              >
                <span>Reference Standards ({useBundledProfile ? 'Default Enterprise Profile' : 'Custom Profile'})</span>
                <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                  {settingsOpen ? '− Close' : '+ Edit Standards'}
                </span>
              </button>

              {settingsOpen && (
                <div className="accordion-body">
                  <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="profile_mode"
                        checked={useBundledProfile}
                        onChange={() => setUseBundledProfile(true)}
                      />
                      <span>Use Default Profile ({DEFAULT_BRAND_GUIDELINES.length} guidelines, {DEFAULT_APPROVED_TERMS.length} terms, {DEFAULT_APPROVED_FACTS.length} facts)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="profile_mode"
                        checked={!useBundledProfile}
                        onChange={() => setUseBundledProfile(false)}
                      />
                      <span>Customize Profile JSON</span>
                    </label>
                  </div>

                  {!useBundledProfile && (
                    <div>
                      <div className="standards-tabs-row">
                        <button
                          type="button"
                          className={`standards-tab-btn ${settingsTab === 'terms' ? 'active' : ''}`}
                          onClick={() => setSettingsTab('terms')}
                        >
                          Approved Terms ({approvedTerms.length})
                        </button>
                        <button
                          type="button"
                          className={`standards-tab-btn ${settingsTab === 'guidelines' ? 'active' : ''}`}
                          onClick={() => setSettingsTab('guidelines')}
                        >
                          Brand Guidelines ({brandGuidelines.length})
                        </button>
                        <button
                          type="button"
                          className={`standards-tab-btn ${settingsTab === 'facts' ? 'active' : ''}`}
                          onClick={() => setSettingsTab('facts')}
                        >
                          Approved Facts ({approvedFacts.length})
                        </button>
                      </div>

                      {settingsTab === 'terms' && (
                        <textarea
                          className="standards-code-editor"
                          value={termsJson}
                          onChange={(e) => handleUpdateTerms(e.target.value)}
                          placeholder="JSON array of terminology rules..."
                          aria-label="Terminology rules JSON"
                        />
                      )}

                      {settingsTab === 'guidelines' && (
                        <textarea
                          className="standards-code-editor"
                          value={guidelinesJson}
                          onChange={(e) => handleUpdateGuidelines(e.target.value)}
                          placeholder="JSON array of brand guidelines..."
                          aria-label="Brand guidelines JSON"
                        />
                      )}

                      {settingsTab === 'facts' && (
                        <textarea
                          className="standards-code-editor"
                          value={factsJson}
                          onChange={(e) => handleUpdateFacts(e.target.value)}
                          placeholder="JSON array of approved facts..."
                          aria-label="Approved facts JSON"
                        />
                      )}

                      {settingsError && (
                        <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                          JSON Parse Error: {settingsError}
                        </p>
                      )}

                      <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-text"
                          style={{ fontSize: '0.75rem' }}
                          onClick={handleResetSettings}
                        >
                          Reset to Defaults
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Editorial Findings Ledger */}
          <div className="findings-panel">
            <div className="findings-header-area">
              <div className="findings-title-row">
                <span className="panel-heading">SECTION 02: EDITORIAL FINDINGS LEDGER</span>
                {findings.length > 0 && (
                  <span className="findings-count-pill">
                    {activeCount} Active • {dismissedCount} Dismissed
                  </span>
                )}
              </div>

              {/* Summary Banner if Result Exists */}
              {reviewResult && (
                <div className="findings-summary-box">
                  <div className="summary-headline-text">
                    {reviewResult.review_summary}
                  </div>
                  <div className="summary-meta-badges">
                    <span className="badge-mandate">
                      Human Review Required
                    </span>
                    {reviewResult.review_status && (
                      <span className="badge-engine">
                        Rules: {reviewResult.review_status.terminology_check} • Groq AI: {reviewResult.review_status.ai_review_check}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Category Filter Chips Bar */}
              {findings.length > 0 && (
                <div className="filter-ledger-bar">
                  <button
                    type="button"
                    className={`ledger-chip-btn ${selectedCategory === 'All' ? 'active' : ''}`}
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
                        className={`ledger-chip-btn ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scrollable Findings Region */}
            <div className="findings-scroll-area">
              {/* 1. Loading State */}
              {isReviewing && (
                <div className="ledger-state-center">
                  <div className="state-glyph">¶</div>
                  <h3 className="state-title">Auditing Manuscript</h3>
                  <p className="state-caption">
                    Groq Cloud AI is cross-referencing your draft against tone rules, prohibited terms, and approved facts...
                  </p>
                </div>
              )}

              {/* 2. Error State */}
              {!isReviewing && reviewError && (
                <div className="ledger-state-center">
                  <div style={{ color: 'var(--danger)', fontSize: '2rem', marginBottom: '0.5rem' }}>✕</div>
                  <h3 className="state-title" style={{ color: 'var(--danger)' }}>Audit Request Failed</h3>
                  <p className="state-caption">
                    {reviewError}
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleExecuteReview}
                  >
                    Retry Audit
                  </button>
                </div>
              )}

              {/* 3. Empty Initial State */}
              {!isReviewing && !reviewError && !reviewResult && (
                <div className="ledger-state-center">
                  <div className="state-glyph">§</div>
                  <h3 className="state-title">No Findings Recorded Yet</h3>
                  <p className="state-caption">
                    Enter or paste draft copy into the manuscript editor on the left and click &ldquo;Run Brand Review&rdquo; to begin.
                  </p>
                </div>
              )}

              {/* 4. Zero Findings State */}
              {!isReviewing && !reviewError && reviewResult && findings.length === 0 && (
                <div className="ledger-state-center">
                  <div style={{ color: 'var(--success)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>✓</div>
                  <h3 className="state-title" style={{ color: 'var(--success)' }}>Manuscript Certified Compliant</h3>
                  <p className="state-caption">
                    No terminology issues, tone hyperbole, or factual discrepancies detected against provided standards.
                  </p>
                </div>
              )}

              {/* 5. Findings List */}
              {!isReviewing && !reviewError && reviewResult && findings.length > 0 && (
                filteredFindings.map((finding) => {
                  const isDismissed = dismissedFindingIds.has(finding.id);
                  const severityKey = finding.severity.toLowerCase();

                  return (
                    <div
                      key={finding.id}
                      className={`ledger-finding-item ${isDismissed ? 'dismissed' : ''}`}
                    >
                      <div className="finding-row-head">
                        <div className="finding-badges">
                          <span className="tag-badge cat">{finding.category}</span>
                          <span className={`tag-badge sev-${severityKey}`}>
                            {finding.severity}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                            Confidence: {finding.confidence}
                          </span>
                        </div>
                        <span className="finding-id-label">{finding.id}</span>
                      </div>

                      {finding.excerpt && (
                        <div className="finding-excerpt-callout">
                          &ldquo;{finding.excerpt}&rdquo;
                        </div>
                      )}

                      <p className="finding-explanation-body">
                        {finding.explanation}
                      </p>

                      {finding.suggestion && (
                        <div className="finding-rewrite-box">
                          <div className="rewrite-text-group">
                            <span className="rewrite-prefix">Suggested rewrite:</span>
                            <span>&ldquo;{finding.suggestion}&rdquo;</span>
                          </div>
                          {!isDismissed && (
                            <button
                              type="button"
                              className="btn-accept-rewrite"
                              onClick={() => handleAcceptSuggestion(finding)}
                              title="Replace excerpt with suggestion in draft editor"
                            >
                              Accept suggestion
                            </button>
                          )}
                        </div>
                      )}

                      <div className="finding-footer-meta">
                        <div className="evidence-tags-wrap">
                          {finding.evidence_ids && finding.evidence_ids.length > 0 && (
                            <>
                              <span style={{ fontWeight: 500 }}>Evidence:</span>
                              {finding.evidence_ids.map((id) => (
                                <span key={id} className="evidence-id-code">
                                  {id}
                                </span>
                              ))}
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn-dismiss-finding"
                          onClick={() => handleToggleDismiss(finding.id)}
                        >
                          {isDismissed ? 'Undo dismiss' : 'Dismiss'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewWorkspacePage;
