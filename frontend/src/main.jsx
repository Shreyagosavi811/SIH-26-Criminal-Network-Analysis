import React from 'react';
import ReactDOM from 'react-dom/client';

// Defensive guards for React Fast Refresh and stale workers
if (typeof window !== 'undefined') {
  if (!window.$RefreshReg$) window.$RefreshReg$ = () => {};
  if (!window.$RefreshSig$) window.$RefreshSig$ = () => (type) => type;
}
import App from './App.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import './css/main.css';

// Clear any rogue service workers from other projects on the same localhost port
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
