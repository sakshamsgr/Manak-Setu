import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/i18n'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Auto-register PWA service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('A new version of BIS AI Assistant is available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('BIS AI Assistant is ready for offline use.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
