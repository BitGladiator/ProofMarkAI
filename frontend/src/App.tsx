import React, { useState, useEffect, useCallback } from 'react';
import { Router, useRouter } from './router';
import { HomePage } from './pages/HomePage';
import { ReviewWorkspacePage } from './pages/ReviewWorkspacePage';
import { checkHealth } from './api/client';

const AppContent: React.FC = () => {
  const { path } = useRouter();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const runHealthCheck = useCallback(async () => {
    setBackendStatus('checking');
    try {
      await checkHealth();
      setBackendStatus('connected');
    } catch {
      setBackendStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    runHealthCheck();
    // Refresh backend connection check every 30 seconds
    const interval = setInterval(runHealthCheck, 30000);
    return () => clearInterval(interval);
  }, [runHealthCheck]);

  // Route routing
  if (path === '/review') {
    return (
      <ReviewWorkspacePage
        backendStatus={backendStatus}
        onRetryConnection={runHealthCheck}
      />
    );
  }

  return (
    <HomePage
      backendStatus={backendStatus}
      onRetryConnection={runHealthCheck}
    />
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
