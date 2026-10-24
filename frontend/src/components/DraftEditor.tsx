import React from 'react';

interface DraftEditorProps {
  draftText: string;
  onDraftChange: (text: string) => void;
  onLoadSample: () => void;
  onClearDraft: () => void;
  onSubmitReview: () => void;
  isReviewing: boolean;
  maxDraftLength?: number;
}

export const DraftEditor: React.FC<DraftEditorProps> = ({
  draftText,
  onDraftChange,
  onLoadSample,
  onClearDraft,
  onSubmitReview,
  isReviewing,
  maxDraftLength = 20000
}) => {
  const isDraftEmpty = draftText.trim().length === 0;
  const isOverLimit = draftText.length > maxDraftLength;

  const handleClear = () => {
    if (draftText.trim().length > 30) {
      const confirmed = window.confirm(
        'Are you sure you want to clear your draft? Unsaved edits will be lost.'
      );
      if (!confirmed) return;
    }
    onClearDraft();
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <label htmlFor="draft-editor-textarea" className="panel-title">
          Draft content
        </label>
        <div className="editor-controls">
          <button
            type="button"
            className="btn-secondary"
            onClick={onLoadSample}
            disabled={isReviewing}
            title="Insert a realistic marketing sample draft"
          >
            Load sample
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClear}
            disabled={isReviewing || isDraftEmpty}
            title="Clear the draft text"
          >
            Clear
          </button>
        </div>
      </div>

      <textarea
        id="draft-editor-textarea"
        className="draft-textarea"
        placeholder="Paste draft marketing or communication copy here to review against brand guidelines..."
        value={draftText}
        onChange={(e) => onDraftChange(e.target.value)}
        disabled={isReviewing}
        aria-label="Draft copy to review"
      />

      <div className="draft-meta">
        <span
          style={{
            color: isOverLimit ? 'var(--danger)' : undefined,
            fontWeight: isOverLimit ? 600 : 400
          }}
        >
          {draftText.length.toLocaleString()} / {maxDraftLength.toLocaleString()} characters
        </span>
        {isOverLimit && (
          <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>
            Draft exceeds maximum allowed length
          </span>
        )}
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={onSubmitReview}
        disabled={isDraftEmpty || isOverLimit || isReviewing}
      >
        {isReviewing ? (
          <>
            <span className="spinner" aria-hidden="true"></span>
            Reviewing content...
          </>
        ) : (
          'Review content'
        )}
      </button>
    </div>
  );
};
