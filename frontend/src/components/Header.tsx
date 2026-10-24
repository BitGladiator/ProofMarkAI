import React from 'react';

interface HeaderProps {
  status: 'checking' | 'connected' | 'disconnected';
  onRetryConnection: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onRetryConnection }) => {
  return (
    <header className="app-header">
      <div className="brand-block">
        <span className="brand-title">ProofMark AI</span>
        <span className="brand-subtitle">Brand content review</span>
      </div>

      <div className="header-status">
        {status === 'checking' && (
          <span className="status-badge checking">
            <span className="status-dot"></span>
            Checking backend...
          </span>
        )}
        {status === 'connected' && (
          <span className="status-badge connected" title="Backend service is operational">
            <span className="status-dot"></span>
            Connected
          </span>
        )}
        {status === 'disconnected' && (
          <span className="status-badge disconnected">
            <span className="status-dot"></span>
            Disconnected
            <button
              type="button"
              className="status-retry-btn"
              onClick={onRetryConnection}
              title="Retry connection"
            >
              Retry
            </button>
          </span>
        )}
      </div>
    </header>
  );
};
