import React, { useState } from 'react';
import { BrandGuideline, ApprovedTerm, ApprovedFact } from '../types';

interface ReferenceSettingsProps {
  useBundledProfile: boolean;
  onToggleBundledProfile: (useBundled: boolean) => void;
  brandGuidelines: BrandGuideline[];
  onBrandGuidelinesChange: (guidelines: BrandGuideline[]) => void;
  approvedTerms: ApprovedTerm[];
  onApprovedTermsChange: (terms: ApprovedTerm[]) => void;
  approvedFacts: ApprovedFact[];
  onApprovedFactsChange: (facts: ApprovedFact[]) => void;
  isReviewing: boolean;
}

export const ReferenceSettings: React.FC<ReferenceSettingsProps> = ({
  useBundledProfile,
  onToggleBundledProfile,
  brandGuidelines,
  onBrandGuidelinesChange,
  approvedTerms,
  onApprovedTermsChange,
  approvedFacts,
  onApprovedFactsChange,
  isReviewing
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'guidelines' | 'terms' | 'facts'>('terms');

  const [guidelinesJson, setGuidelinesJson] = useState(
    JSON.stringify(brandGuidelines, null, 2)
  );
  const [termsJson, setTermsJson] = useState(
    JSON.stringify(approvedTerms, null, 2)
  );
  const [factsJson, setFactsJson] = useState(
    JSON.stringify(approvedFacts, null, 2)
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleUpdateGuidelines = (val: string) => {
    setGuidelinesJson(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) throw new Error('Must be an array of guidelines');
      onBrandGuidelinesChange(parsed);
      setValidationError(null);
    } catch (e: unknown) {
      setValidationError((e as Error).message);
    }
  };

  const handleUpdateTerms = (val: string) => {
    setTermsJson(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) throw new Error('Must be an array of terminology rules');
      onApprovedTermsChange(parsed);
      setValidationError(null);
    } catch (e: unknown) {
      setValidationError((e as Error).message);
    }
  };

  const handleUpdateFacts = (val: string) => {
    setFactsJson(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) throw new Error('Must be an array of approved facts');
      onApprovedFactsChange(parsed);
      setValidationError(null);
    } catch (e: unknown) {
      setValidationError((e as Error).message);
    }
  };

  return (
    <div className="reference-section">
      <button
        type="button"
        className="reference-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>Brand standards & reference rules</span>
        <span>{isOpen ? '▲ Hide' : '▼ View / Customize'}</span>
      </button>

      {isOpen && (
        <div className="reference-body">
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="ref-profile-mode"
                checked={useBundledProfile}
                onChange={() => onToggleBundledProfile(true)}
                disabled={isReviewing}
              />
              <span>Use bundled sample profile (backend defaults)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', marginLeft: '1rem' }}>
              <input
                type="radio"
                name="ref-profile-mode"
                checked={!useBundledProfile}
                onChange={() => onToggleBundledProfile(false)}
                disabled={isReviewing}
              />
              <span>Custom reference rules</span>
            </label>
          </div>

          {!useBundledProfile && (
            <div>
              <div className="reference-tabs">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
                  onClick={() => setActiveTab('terms')}
                >
                  Terminology ({approvedTerms.length})
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'guidelines' ? 'active' : ''}`}
                  onClick={() => setActiveTab('guidelines')}
                >
                  Voice Guidelines ({brandGuidelines.length})
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'facts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('facts')}
                >
                  Approved Facts ({approvedFacts.length})
                </button>
              </div>

              {activeTab === 'terms' && (
                <div>
                  <textarea
                    className="json-editor"
                    value={termsJson}
                    onChange={(e) => handleUpdateTerms(e.target.value)}
                    disabled={isReviewing}
                    placeholder='[{"id": "TERM-01", "preferred": "customer", "avoid": ["consumer"]}]'
                  />
                  <div className="reference-note">
                    Rules require an <code>id</code>, <code>preferred</code> term, and an <code>avoid</code> array.
                  </div>
                </div>
              )}

              {activeTab === 'guidelines' && (
                <div>
                  <textarea
                    className="json-editor"
                    value={guidelinesJson}
                    onChange={(e) => handleUpdateGuidelines(e.target.value)}
                    disabled={isReviewing}
                    placeholder='[{"id": "VOICE-01", "text": "Clear and professional language"}]'
                  />
                  <div className="reference-note">
                    Guidelines require an <code>id</code> and <code>text</code> description.
                  </div>
                </div>
              )}

              {activeTab === 'facts' && (
                <div>
                  <textarea
                    className="json-editor"
                    value={factsJson}
                    onChange={(e) => handleUpdateFacts(e.target.value)}
                    disabled={isReviewing}
                    placeholder='[{"id": "FACT-01", "text": "Available in 10 regions"}]'
                  />
                  <div className="reference-note">
                    Approved facts require an <code>id</code> and verified <code>text</code>.
                  </div>
                </div>
              )}

              {validationError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                  JSON syntax error: {validationError}
                </div>
              )}
            </div>
          )}

          {useBundledProfile && (
            <div className="reference-note">
              Using the bundled brand profile configured on the backend (4 terminology rules, 3 tone/voice guidelines, 4 verified facts). Reference arrays will be resolved automatically by the server.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
