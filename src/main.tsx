import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { useApiKeyStore } from './store/apiKeyStore';
import './index.css';

// Initialize API key from storage
useApiKeyStore.getState().initializeFromStorage();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);