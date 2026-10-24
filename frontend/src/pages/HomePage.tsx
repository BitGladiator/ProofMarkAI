import React, { useState, useEffect } from 'react';
import { useRouter } from '../router';
import {
  ShieldLogoIcon,
  ArrowRightIcon,
  SparklesIcon,
  BookOpenIcon,
  ScaleIcon,
  UserCheckIcon,
  MenuIcon,
  CloseIcon
} from '../components/Icons';
import { Finding } from '../types';

// Showcase demonstration findings for the homepage excerpt.
// Loaded with realistic audit animations without consuming Groq Cloud tokens on every page refresh.
const SHOWCASE_FINDINGS: Finding[] = [
  {
    id: 'F-001',
    category: 'Terminology',
    severity: 'Low',
    excerpt: 'every consumer',
    explanation: 'The brand terminology rule prefers "customer" over "consumer".',
    suggestion: 'every customer',
    evidence_ids: ['TERM-01'],
    confidence: 'high'
  },
  {
    id: 'F-002',
    category: 'Tone',
    severity: 'Medium',
    excerpt: 'Our revolutionary AI platform',
    explanation: 'The word "revolutionary" is a superlative claim discouraged by brand voice guideline VOICE-01.',
    suggestion: 'Our innovative AI platform',
    evidence_ids: ['VOICE-01'],
    confidence: 'high'
  },
  {
    id: 'F-003',
    category: 'FactualConsistency',
    severity: 'High',
    excerpt: 'across all regions',
    explanation: 'Contradicts verified fact FACT-01 stating the service is available in 10 regions.',
    suggestion: 'across the 10 supported regions',
    evidence_ids: ['FACT-01'],
    confidence: 'high'
  },
  {
    id: 'F-004',
    category: 'Claims',
    severity: 'Medium',
    excerpt: '100% automated guaranteed compliance',
    explanation: 'The claim of 100% automated guaranteed compliance is unverified and requires human verification.',
    suggestion: 'automated compliance support',
    evidence_ids: ['VOICE-03'],
    confidence: 'medium'
  }
];

const SHOWCASE_SUMMARY =
  'The draft contains several brand compliance issues: a prohibited term, hyperbolic language, an inaccurate regional coverage claim, and an unverified compliance guarantee. Human review recommended before publication.';

interface HomePageProps {
  backendStatus: 'checking' | 'connected' | 'disconnected';
  onRetryConnection: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  backendStatus,
  onRetryConnection
}) => {
  const { navigate } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero section review state (loads locally with audit animation, 0 Groq Cloud tokens consumed)
  const defaultExcerpt =
    'Our revolutionary AI platform provides every consumer with 100% automated guaranteed compliance across all regions.';
  const [liveExcerpt, setLiveExcerpt] = useState(defaultExcerpt);
  const [liveFindings, setLiveFindings] = useState<Finding[] | null>(null);
  const [liveSummary, setLiveSummary] = useState<string | null>(null);
  const [isLoadingScan, setIsLoadingScan] = useState(true);
  const [scanError] = useState<string | null>(null);

  const handleRunLiveScan = (textToScan = liveExcerpt) => {
    setIsLoadingScan(true);

    // Realistic brief audit delay showing the loading state without consuming Groq Cloud tokens
    setTimeout(() => {
      let active = [...SHOWCASE_FINDINGS];
      if (!textToScan.includes('every consumer') && !textToScan.includes('consumer')) {
        active = active.filter((f) => f.id !== 'F-001');
      }
      if (!textToScan.includes('revolutionary')) {
        active = active.filter((f) => f.id !== 'F-002');
      }
      if (!textToScan.includes('all regions')) {
        active = active.filter((f) => f.id !== 'F-003');
      }
      if (!textToScan.includes('guaranteed compliance')) {
        active = active.filter((f) => f.id !== 'F-004');
      }

      setLiveFindings(active);
      setLiveSummary(
        active.length === 0
          ? 'All brand guidelines and terminology rules satisfied.'
          : SHOWCASE_SUMMARY
      );
      setIsLoadingScan(false);
    }, 450);
  };

  // Initial load: show the audit loading animation on mount, then render review findings
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRunLiveScan(defaultExcerpt);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile drawer on Escape key or on window resize above 768px
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  const handleAcceptSuggestion = (finding: Finding) => {
    if (!finding.suggestion || !finding.excerpt) return;
    const updated = liveExcerpt.replace(finding.excerpt, finding.suggestion);
    setLiveExcerpt(updated);
    setLiveFindings((prev) => (prev ? prev.filter((f) => f.id !== finding.id) : null));
  };

  const handleNavClick = (anchorId: string) => {
    setMobileMenuOpen(false);
    navigate(anchorId);
  };

  // Cap displayed preview findings to at most 3
  const previewCap = 3;
  const displayedFindings = liveFindings ? liveFindings.slice(0, previewCap) : [];
  const totalFindingsCount = liveFindings ? liveFindings.length : 0;
  const excessFindingsCount = Math.max(0, totalFindingsCount - previewCap);

  return (
    <div className="home-wrapper">
      {/* 1. Global Editorial Navigation */}
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

          {/* Desktop Navigation Links */}
          <nav className="nav-links-desktop" aria-label="Main Navigation">
            <button
              type="button"
              className="nav-link"
              onClick={() => handleNavClick('#standards')}
            >
              Standards
            </button>
            <button
              type="button"
              className="nav-link"
              onClick={() => handleNavClick('#workflow')}
            >
              Workflow
            </button>
            <button
              type="button"
              className="nav-link"
              onClick={() => handleNavClick('#principles')}
            >
              Editorial Principle
            </button>
          </nav>

          {/* Actions & Backend Status */}
          <div className="nav-actions">
            <div className="status-pill-wrap" title="Status of the ProofMark Review Engine">
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
                  <span className="status-label-full">Connecting...</span>
                  <span className="status-label-mobile">Connecting</span>
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn-primary nav-cta-btn"
              onClick={() => navigate('/review')}
            >
              <span className="btn-text-full">Start reviewing</span>
              <span className="btn-text-mobile">Review</span>
              <ArrowRightIcon size={14} />
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer & Backdrop */}
        {mobileMenuOpen && (
          <>
            <div
              className="mobile-drawer-backdrop"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
              <nav className="mobile-drawer-links" aria-label="Sections">
                <button
                  type="button"
                  className="mobile-nav-link"
                  onClick={() => handleNavClick('#standards')}
                >
                  <span>Standards</span>
                  <span className="mobile-nav-arrow" aria-hidden="true">&rarr;</span>
                </button>
                <button
                  type="button"
                  className="mobile-nav-link"
                  onClick={() => handleNavClick('#workflow')}
                >
                  <span>Workflow</span>
                  <span className="mobile-nav-arrow" aria-hidden="true">&rarr;</span>
                </button>
                <button
                  type="button"
                  className="mobile-nav-link"
                  onClick={() => handleNavClick('#principles')}
                >
                  <span>Editorial Principle</span>
                  <span className="mobile-nav-arrow" aria-hidden="true">&rarr;</span>
                </button>
              </nav>

              <div className="mobile-drawer-footer">
                <button
                  type="button"
                  className="btn-primary btn-block mobile-drawer-cta"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/review');
                  }}
                >
                  Start reviewing
                  <ArrowRightIcon size={15} />
                </button>

                <div className="mobile-drawer-status-line">
                  <span className="mobile-drawer-status-label">Engine status</span>
                  {backendStatus === 'connected' && (
                    <span className="status-pill connected">
                      <span className="status-dot"></span>
                      Engine Online
                    </span>
                  )}
                  {backendStatus === 'disconnected' && (
                    <span className="status-pill disconnected">
                      <span className="status-dot"></span>
                      Engine Offline
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
                      Connecting...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="hero-section">
        <div className="hero-grid">
          {/* Left: Editorial Positioning */}
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-rule"></span>
              <span>BRAND STANDARDS / CONTENT REVIEW</span>
            </div>

            <h1 className="hero-title">
              Good content deserves a second set of eyes.
            </h1>

            <p className="hero-subtitle">
              ProofMark checks your draft against your brand voice, preferred terminology, and approved facts—so your team can review before publishing.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="btn-primary btn-large"
                onClick={() => navigate('/review')}
              >
                Review a draft
                <ArrowRightIcon size={16} />
              </button>

              <button
                type="button"
                className="btn-secondary btn-large"
                onClick={() => handleNavClick('#workflow')}
              >
                Explore the workflow
              </button>
            </div>

            <div className="hero-footnote">
              <span className="hero-footnote-mark">§</span>
              <span>Editorial quality control powered by Groq Cloud AI. Human editorial discretion preserved.</span>
            </div>
          </div>

          {/* Right: Bounded Live Editorial Preview */}
          <div className="hero-right">
            <div className="preview-frame" aria-label="Interactive Proofing Preview">
              {/* Preview Header */}
              <div className="preview-top-strip">
                <div className="preview-meta-title">
                  <span style={{ color: 'var(--primary)' }}>●</span>
                  <span>EDITORIAL PROOFING DESK</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="tag-badge cat">AUDIT PREVIEW</span>
                </div>
              </div>

              {/* Preview Content Body */}
              <div className="preview-body">
                {/* Fixed Sample Box */}
                <div className="preview-sample-box">
                  <div className="preview-sample-head">
                    <span className="preview-label-small">SAMPLE DRAFT EXCERPT</span>
                    <button
                      type="button"
                      className="btn-text"
                      style={{ fontSize: '0.72rem', padding: '0.1rem 0.35rem' }}
                      onClick={() => handleRunLiveScan(liveExcerpt)}
                      disabled={isLoadingScan}
                    >
                      {isLoadingScan ? 'Auditing...' : '↻ Re-scan'}
                    </button>
                  </div>
                  <p className="preview-sample-quote">
                    &ldquo;{liveExcerpt}&rdquo;
                  </p>
                </div>

                {/* Bounded Scrollable Findings Area */}
                <div className="preview-scroll-area">
                  {isLoadingScan && (
                    <div style={{ textAlign: 'center', padding: '1.75rem 1rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'inline-block', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                        [ AUDITING DRAFT ]
                      </div>
                      <p style={{ fontSize: '0.82rem' }}>Evaluating draft against terminology rules and brand guidelines...</p>
                    </div>
                  )}

                  {scanError && (
                    <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', padding: '0.75rem', borderRadius: 'var(--radius-xs)', color: 'var(--danger)', fontSize: '0.82rem' }}>
                      <strong>Review request error:</strong> {scanError}
                      <button
                        type="button"
                        style={{ display: 'block', marginTop: '0.35rem', textDecoration: 'underline', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                        onClick={() => handleRunLiveScan()}
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {!isLoadingScan && !scanError && liveFindings === null && (
                    <div style={{ textAlign: 'center', padding: '1.5rem 1rem', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-xs)' }}>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        Ready to inspect this draft against verified brand standards.
                      </p>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleRunLiveScan()}
                      >
                        <SparklesIcon size={14} /> Run Live Review
                      </button>
                    </div>
                  )}

                  {!isLoadingScan && !scanError && liveFindings && (
                    <>
                      {/* Compact Assessment Banner */}
                      {liveSummary && (
                        <div className="preview-summary-banner">
                          <strong>Desk Assessment:</strong> {liveSummary}
                        </div>
                      )}

                      {/* Findings List (Capped to previewCap) */}
                      {displayedFindings.length === 0 ? (
                        <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--success)', fontSize: '0.82rem' }}>
                          ✓ Draft meets all verified brand requirements.
                        </div>
                      ) : (
                        displayedFindings.map((finding) => (
                          <div key={finding.id} className="preview-item-card">
                            <div className="preview-item-head">
                              <div className="preview-tags-group">
                                <span className="tag-badge cat">{finding.category}</span>
                                <span className={`tag-badge sev-${finding.severity.toLowerCase()}`}>
                                  {finding.severity}
                                </span>
                                {finding.evidence_ids.length > 0 && (
                                  <span className="tag-badge cat">
                                    {finding.evidence_ids.join(', ')}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                                {finding.id}
                              </span>
                            </div>

                            <div className="preview-item-desc">
                              {finding.explanation}
                            </div>

                            {finding.suggestion && (
                              <div className="preview-suggestion-row">
                                <span className="preview-sugg-text">
                                  <strong>Preferred:</strong> &ldquo;{finding.suggestion}&rdquo;
                                </span>
                                <button
                                  type="button"
                                  className="btn-mini-action"
                                  onClick={() => handleAcceptSuggestion(finding)}
                                >
                                  Apply
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      {/* Explicit cap notice if additional findings exist */}
                      {excessFindingsCount > 0 && (
                        <div className="preview-capped-notice">
                          <span>
                            Showing {previewCap} of {totalFindingsCount} findings.
                          </span>
                          <button
                            type="button"
                            className="preview-open-link"
                            onClick={() => navigate('/review')}
                          >
                            Open full workspace to review all {totalFindingsCount} &rarr;
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Fixed Preview Footer Strip */}
                <div className="preview-footer-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <UserCheckIcon size={13} />
                    <span>Interactive preview • Live Groq Cloud review in workspace</span>
                  </div>
                  <button
                    type="button"
                    className="preview-open-link"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => navigate('/review')}
                  >
                    Launch workspace &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Editorial Value Strip */}
      <section className="editorial-strip" id="standards">
        <div className="strip-inner">
          <div className="strip-col">
            <div className="strip-num">01 / VOICE</div>
            <div className="strip-heading">Tone & Voice Audit</div>
            <div className="strip-desc">Catches unsubstantiated superlatives, hyperbolic promises, and misaligned tone.</div>
          </div>

          <div className="strip-col">
            <div className="strip-num">02 / LEXICON</div>
            <div className="strip-heading">Approved Terminology</div>
            <div className="strip-desc">Deterministic enforcement of preferred vocabulary and prohibited synonyms.</div>
          </div>

          <div className="strip-col">
            <div className="strip-num">03 / FACTS</div>
            <div className="strip-heading">Claim Consistency</div>
            <div className="strip-desc">Cross-references claims with approved enterprise facts and flags unverified assertions.</div>
          </div>

          <div className="strip-col">
            <div className="strip-num">04 / CONTROL</div>
            <div className="strip-heading">Human Editorial Power</div>
            <div className="strip-desc">AI flags discrepancies and proposes alternatives. Final publication approval remains human.</div>
          </div>
        </div>
      </section>

      {/* 4. Editorial Features Section */}
      <section className="section-editorial" id="features">
        <div className="section-container">
          <div className="section-header-block">
            <div className="section-kicker">EDITORIAL GOVERNANCE CAPABILITIES</div>
            <h2 className="section-title">A rigorous standard for every piece of published communication.</h2>
            <p className="section-lead">
              ProofMark acts as your brand editorial desk—auditing copy against strict governance guidelines before press release, launch copy, or public distribution.
            </p>
          </div>

          <div className="features-ledger-grid">
            <div className="ledger-card">
              <div className="ledger-card-top">
                <span className="ledger-code">LEDGER RULE [VOICE-01]</span>
                <SparklesIcon size={16} />
              </div>
              <h3 className="ledger-title">Superlative & Hyperbole Guard</h3>
              <p className="ledger-body">
                Discourages unsubstantiated buzzwords like &ldquo;revolutionary breakthrough&rdquo; and &ldquo;guaranteed 100% compliance&rdquo; in favor of accurate, credible claims.
              </p>
              <div className="ledger-proof-example">
                &ldquo;revolutionary AI platform&rdquo; &rarr; &ldquo;innovative AI platform&rdquo;
              </div>
            </div>

            <div className="ledger-card">
              <div className="ledger-card-top">
                <span className="ledger-code">LEDGER RULE [TERM-01]</span>
                <BookOpenIcon size={16} />
              </div>
              <h3 className="ledger-title">Controlled Lexicon Enforcement</h3>
              <p className="ledger-body">
                Ensures approved terminology is applied consistently across all messaging, preventing deprecated terminology from slipping into final copy.
              </p>
              <div className="ledger-proof-example">
                &ldquo;every consumer&rdquo; &rarr; &ldquo;every customer&rdquo;
              </div>
            </div>

            <div className="ledger-card">
              <div className="ledger-card-top">
                <span className="ledger-code">LEDGER RULE [FACT-01]</span>
                <ScaleIcon size={16} />
              </div>
              <h3 className="ledger-title">Factual Contradiction Detection</h3>
              <p className="ledger-body">
                Identifies discrepancies between marketing statements and verified product parameters, ensuring representations are truthful.
              </p>
              <div className="ledger-proof-example">
                &ldquo;across all regions&rdquo; &rarr; &ldquo;across 10 supported regions&rdquo;
              </div>
            </div>

            <div className="ledger-card">
              <div className="ledger-card-top">
                <span className="ledger-code">HUMAN-IN-THE-LOOP</span>
                <UserCheckIcon size={16} />
              </div>
              <h3 className="ledger-title">Reviewer Action Ledger</h3>
              <p className="ledger-body">
                Suggestions are individually inspected, accepted, or dismissed by human communications editors. The system never publishes or approves automatically.
              </p>
              <div className="ledger-proof-example">
                Full review history, evidence citations, and manual overrides retained.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Editorial Workflow Section */}
      <section className="section-editorial" id="workflow" style={{ background: '#ffffff' }}>
        <div className="section-container">
          <div className="section-header-block">
            <div className="section-kicker">WORKFLOW</div>
            <h2 className="section-title">Three steps to certified brand alignment.</h2>
            <p className="section-lead">
              A structured review pipeline designed for seamless integration into communications and marketing workflows.
            </p>
          </div>

          <div className="workflow-steps-row">
            <div className="workflow-step-card">
              <span className="step-marker">STEP 01</span>
              <h3 className="step-card-title">Ingest Draft & Guidelines</h3>
              <p className="step-card-text">
                Paste draft marketing copy and supply enterprise brand standards, approved vocabulary lists, and verified factual statements.
              </p>
            </div>

            <div className="workflow-step-card">
              <span className="step-marker">STEP 02</span>
              <h3 className="step-card-title">Multi-Layer Audit</h3>
              <p className="step-card-text">
                Deterministic regex catches exact terminology violations while Groq Cloud AI audits tone, superlatives, and factual claims.
              </p>
            </div>

            <div className="workflow-step-card">
              <span className="step-marker">STEP 03</span>
              <h3 className="step-card-title">Editorial Sign-Off</h3>
              <p className="step-card-text">
                Review findings with evidence citations and confidence metrics. Accept suggested rewrites into your editor with a single click.
              </p>
            </div>
          </div>

          {/* Principle Banner */}
          <div className="human-principle-banner" id="principles">
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brass)' }}>
                CORE PRINCIPLE
              </span>
              <h3 className="principle-title">
                Human accountability is irreplaceable.
              </h3>
            </div>
            <p className="principle-text">
              Automated review accelerates editorial vigilance, but final responsibility for public statements rests with communications professionals. ProofMark flags potential discrepancies and provides verified suggestions, leaving final discretion with the editorial reviewer.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Final Call to Action */}
      <section className="cta-banner-section">
        <div className="cta-banner-inner">
          <h2 className="cta-title">Elevate your publication standards.</h2>
          <p className="cta-lead">
            Audit your draft in real time against approved terminology, tone guidelines, and verified facts.
          </p>
          <button
            type="button"
            className="btn-primary btn-cta-light"
            onClick={() => navigate('/review')}
          >
            Open Review Workspace
            <ArrowRightIcon size={16} />
          </button>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="editorial-footer">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldLogoIcon size={18} />
            <strong>ProofMark AI</strong> — The Brand Standards Desk
          </div>
          <div>
            Built with Groq Cloud AI, Express & React. All editorial rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
