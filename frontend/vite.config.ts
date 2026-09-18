import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'bis-logo.png', 'pwa-192x192.png', 'pwa-512x512.png', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Manak Setu — BIS AI Compliance Portal',
        short_name: 'Manak Setu',
        description: 'Manak Setu: Official AI Compliance Guide for Indian Standards (IS), Product Certification Schemes, Laboratory Testing, and Quality Control Orders.',
        start_url: '/?source=pwa',
        scope: '/',
        theme_color: '#0B3B60',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'any',
        lang: 'en',
        categories: ['government', 'business', 'productivity', 'utilities'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Product Guide',
            short_name: 'Guide',
            description: 'Step-by-step BIS certification guide for your product',
            url: '/?tab=home&source=pwa_shortcut',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Fee Estimator',
            short_name: 'Estimator',
            description: 'Estimate BIS application, inspection, and marking fees',
            url: '/?tab=estimator&source=pwa_shortcut',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Consumer Help',
            short_name: 'Consumer',
            description: 'Verify CM/L marks and consumer grievance reporting',
            url: '/?tab=consumer&source=pwa_shortcut',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Hallmarking',
            short_name: 'Hallmarking',
            description: 'Gold & Silver hallmarking guidance and HUID verification',
            url: '/?tab=hallmarking&source=pwa_shortcut',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/chat/, /^\/auth/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  // FIX: Force upfront bundling of heavy dependencies to stop the 5-second hard reload
  optimizeDeps: {
    include: [
      'lucide-react', 
      'react-markdown', 
      'remark-gfm', 'react-router-dom',
      'canvas-confetti', 
      'i18next', 
      'react-i18next'
      
    ]
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      '/chat': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
})