import React, { useState } from 'react';
import { useRouter } from '../router';
import {
  ShieldLogoIcon,
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon,
  BookOpenIcon,
  ScaleIcon,
  UserCheckIcon,
  MenuIcon,
  CloseIcon
} from '../components/Icons';

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
  const [previewAccepted, setPreviewAccepted] = useState(false);

  const handleNavClick = (anchorId: string) => {
    setMobileMenuOpen(false);
    navigate(anchorId);
  };

  return (
    <div className="home-wrapper">
      {/* 1. Global Navigation */}
      <header className="home-header">
        <div className="home-nav-container">
          <div className="logo-group" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <ShieldLogoIcon size={26} />
            <div className="logo-text">
              <span className="brand-name">ProofMark AI</span>
              
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav">
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => handleNavClick('#features')}
            >
              Features
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => handleNavClick('#how-it-works')}
            >
              How it works
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => handleNavClick('#standards')}
            >
              Brand Standards
            </button>
          </nav>

          {/* Actions & Backend Status */}
          <div className="header-actions">
            <div className="status-pill-wrap" title="Live status of the backend API service">
              {backendStatus === 'connected' && (
                <span className="status-pill connected">
                  <span className="status-dot"></span>
                  API Connected
                </span>
              )}
              {backendStatus === 'disconnected' && (
                <span className="status-pill disconnected">
                  <span className="status-dot"></span>
                  API Offline
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

            <button
              type="button"
              className="btn-primary btn-cta"
              onClick={() => navigate('/review')}
            >
              Start reviewing
              <ArrowRightIcon size={16} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu-drawer">
            <button
              type="button"
              className="mobile-nav-link"
              onClick={() => handleNavClick('#features')}
            >
              Features
            </button>
            <button
              type="button"
              className="mobile-nav-link"
              onClick={() => handleNavClick('#how-it-works')}
            >
              How it works
            </button>
            <button
              type="button"
              className="mobile-nav-link"
              onClick={() => handleNavClick('#standards')}
            >
              Brand Standards
            </button>
            <div className="mobile-menu-footer">
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/review');
                }}
              >
                Start reviewing
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-left">
            <div className="hero-eyebrow">
              <SparklesIcon size={14} className="eyebrow-icon" />
              <span>BRAND GOVERNANCE, MADE PRACTICAL</span>
            </div>

            <h1 className="hero-title">
              Every word should sound like your brand.
            </h1>

            <p className="hero-description">
              Review marketing content against your brand voice, approved terminology, and verified reference facts before it reaches your audience.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="btn-primary btn-large"
                onClick={() => navigate('/review')}
              >
                Start reviewing
                <ArrowRightIcon size={18} />
              </button>

              <button
                type="button"
                className="btn-secondary btn-large"
                onClick={() => handleNavClick('#how-it-works')}
              >
                See how it works
              </button>
            </div>

            <div className="hero-footnote">
              <CheckIcon size={14} className="footnote-check" />
              <span>No signup or credit card required. Runs directly in your browser.</span>
            </div>
          </div>

          {/* Hero Right: Illustrative UI Preview */}
          <div className="hero-right">
            <div className="preview-card-frame">
              <div className="preview-header">
                <div className="preview-indicator-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <span className="preview-label">ILLUSTRATIVE REVIEW PREVIEW</span>
              </div>

              <div className="preview-body">
                <div className="preview-editor-box">
                  <div className="preview-box-label">DRAFT TEXT EXCERPT</div>
                  <p className="preview-draft-text">
                    &ldquo;Our revolutionary AI platform provides{' '}
                    <span className="preview-highlight-orange">
                      every consumer
                    </span>{' '}
                    with 100% automated guaranteed compliance across all regions.&rdquo;
                  </p>
                </div>

                <div className="preview-findings-box">
                  <div className="preview-finding-item">
                    <div className="preview-finding-head">
                      <span className="tag-category">Terminology</span>
                      <span className="tag-severity low">Low</span>
                    </div>
                    <div className="preview-finding-desc">
                      The brand terminology rule prefers &ldquo;customer&rdquo; over &ldquo;consumer&rdquo;.
                    </div>
                    <div className="preview-suggestion-pill">
                      <span>
                        <strong>Suggested:</strong> {previewAccepted ? 'customer (Applied)' : 'customer'}
                      </span>
                      <button
                        type="button"
                        className="btn-preview-action"
                        onClick={() => setPreviewAccepted(!previewAccepted)}
                      >
                        {previewAccepted ? 'Undo' : 'Preview accept'}
                      </button>
                    </div>
                  </div>

                  <div className="preview-finding-item">
                    <div className="preview-finding-head">
                      <span className="tag-category">Tone & Voice</span>
                      <span className="tag-severity medium">Medium</span>
                    </div>
                    <div className="preview-finding-desc">
                      &ldquo;100% automated guaranteed compliance&rdquo; uses unsubstantiated superlatives discouraged by VOICE-01.
                    </div>
                  </div>
                </div>

                <div className="preview-footer-note">
                  <UserCheckIcon size={14} />
                  <span>Interactive preview: try full scan in the workspace</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Trust & Capabilities Value Strip */}
      <section className="value-strip">
        <div className="value-strip-container">
          <div className="value-item">
            <span className="value-icon-box">
              <SparklesIcon size={16} />
            </span>
            <div className="value-content">
              <strong>Brand Voice Checks</strong>
              <span>Audit tone against tone and style guidelines</span>
            </div>
          </div>

          <div className="value-item">
            <span className="value-icon-box">
              <BookOpenIcon size={16} />
            </span>
            <div className="value-content">
              <strong>Terminology Consistency</strong>
              <span>Catch deprecated words and enforce approved vocabulary</span>
            </div>
          </div>

          <div className="value-item">
            <span className="value-icon-box">
              <ScaleIcon size={16} />
            </span>
            <div className="value-content">
              <strong>Claim & Fact Verification</strong>
              <span>Cross-reference assertions with verified enterprise facts</span>
            </div>
          </div>

          <div className="value-item">
            <span className="value-icon-box">
              <UserCheckIcon size={16} />
            </span>
            <div className="value-content">
              <strong>Human-Controlled Decisions</strong>
              <span>Reviewers retain full discretion on all suggestions</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="features-section">
        <div className="section-head">
          <span className="section-tag">CORE CAPABILITIES</span>
          <h2 className="section-title">Built for clear, consistent communication</h2>
          <p className="section-subtitle">
            ProofMark AI automates repetitive compliance audits so writers and brand managers can publish with confidence.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-bubble">
              <SparklesIcon size={22} />
            </div>
            <h3 className="feature-heading">Brand Voice Review</h3>
            <p className="feature-body">
              Drafts are checked against supplied tone and voice standards. The engine identifies hyperbolic superlatives, aggressive framing, or off-brand stylistic deviations.
            </p>
            <div className="feature-rule-tag">
              <code>VOICE-01 • Clear, friendly, professional language</code>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble">
              <BookOpenIcon size={22} />
            </div>
            <h3 className="feature-heading">Terminology Consistency</h3>
            <p className="feature-body">
              Deterministic, word-boundary-aware rules scan your text for avoided vocabulary and automatically recommend approved, brand-sanctioned alternatives.
            </p>
            <div className="feature-rule-tag">
              <code>TERM-01 • Prefer &ldquo;customer&rdquo; over &ldquo;consumer&rdquo;</code>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble">
              <ScaleIcon size={22} />
            </div>
            <h3 className="feature-heading">Claims & Factual Consistency</h3>
            <p className="feature-body">
              Factual claims are verified against your approved reference facts. Unsupported or unverified assertions are flagged for human review rather than falsely declared incorrect.
            </p>
            <div className="feature-rule-tag">
              <code>FACT-01 • Verified regional availability data</code>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble">
              <UserCheckIcon size={22} />
            </div>
            <h3 className="feature-heading">Human-in-the-Loop Governance</h3>
            <p className="feature-body">
              AI should assist reviewers, not make final decisions. You have full control to accept individual rewrites, dismiss suggestions, or edit copy before re-running.
            </p>
            <div className="feature-rule-tag">
              <code>Policy • Content is never auto-approved</code>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="how-section">
        <div className="section-head">
          <span className="section-tag">THE WORKFLOW</span>
          <h2 className="section-title">How ProofMark AI works</h2>
          <p className="section-subtitle">
            From raw draft to compliant copy in three simple steps.
          </p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">01</div>
            <h3 className="step-title">Add your draft</h3>
            <p className="step-description">
              Paste your marketing copy, email announcement, or web page text into the workspace editor or click &ldquo;Load sample&rdquo; for instant testing.
            </p>
          </div>

          <div className="step-connector"></div>

          <div className="step-card">
            <div className="step-number">02</div>
            <h3 className="step-title">Review against brand standards</h3>
            <p className="step-description">
              Use bundled standards or customize your own terminology lists, voice guidelines, and verified facts. Click &ldquo;Review content&rdquo; to trigger the engine.
            </p>
          </div>

          <div className="step-connector"></div>

          <div className="step-card">
            <div className="step-number">03</div>
            <h3 className="step-title">Apply suggestions and review again</h3>
            <p className="step-description">
              Inspect structured findings with evidence IDs, accept 1-click suggested rewrites directly in the editor, and re-review anytime.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Standards Section */}
      <section id="standards" className="standards-banner-section">
        <div className="standards-box">
          <div className="standards-content">
            <span className="section-tag light">EXTENSIBLE ARCHITECTURE</span>
            <h2 className="standards-title">Deterministic accuracy meets AI nuance</h2>
            <p className="standards-text">
              By separating rigid terminology matching from AI tone review, ProofMark AI eliminates hallucinations on exact vocabulary while maintaining nuanced voice evaluation.
            </p>
            <div className="standards-badges">
              <span className="badge-standard">Word-boundary regex</span>
              <span className="badge-standard">Provider-neutral AI adapter</span>
              <span className="badge-standard">Evidence verification</span>
              <span className="badge-standard">Pydantic &amp; Zod validated</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call to Action Banner */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-heading">Ready to review your draft?</h2>
            <p className="cta-subheading">
              Open the review workspace now to test copy against brand guidelines with live rule-based and AI audits.
            </p>
            <button
              type="button"
              className="btn-primary btn-large"
              onClick={() => navigate('/review')}
            >
              Open review workspace
              <ArrowRightIcon size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-left">
            <div className="logo-group">
              <ShieldLogoIcon size={20} />
              <span className="footer-brand">ProofMark AI</span>
            </div>
            <p className="footer-desc">
              Brand-governance assistant reviewing marketing and communication drafts against brand guidelines, approved terminology, and approved facts.
            </p>
          </div>

          <div className="footer-nav">
            <div className="footer-col">
              <span className="footer-col-title">Product</span>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => navigate('/review')}
              >
                Review Workspace
              </button>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => handleNavClick('#features')}
              >
                Features
              </button>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => handleNavClick('#how-it-works')}
              >
                How It Works
              </button>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">Documentation</span>
              <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link-btn"
              >
                Interactive API Docs (/docs)
              </a>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => handleNavClick('#standards')}
              >
                Brand Standards
              </button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} ProofMark AI. Built for brand governance.</span>
          <span className="footer-disclaimer">
            AI findings assist human reviewers and do not make final approval decisions.
          </span>
        </div>
      </footer>
    </div>
  );
};
