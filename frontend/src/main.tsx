import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/i18n'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Auto-register PWA service worker with immediate registration and auto-update
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (confirm('A new version of Manak Setu is available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Manak Setu is ready for offline use.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
