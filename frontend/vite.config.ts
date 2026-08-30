import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'bis-logo.svg', 'robots.txt'],
      manifest: {
        name: 'Bureau of Indian Standards AI Assistant',
        short_name: 'BIS AI',
        description: 'Authorized AI assistant for Indian Standards (IS), ISI marking, certification schemes, and BIS lab directories.',
        theme_color: '#0B3B60',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/chat': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
})
