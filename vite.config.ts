import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * Local development proxies `/api` to the API Gateway (default dev port 8080),
 *
 * Set `VITE_DEV_API_PROXY_TARGET=http://localhost:8081` to bypass the gateway and
 * hit the Catalog Service directly when debugging it in isolation.
 */
const DEFAULT_DEV_PROXY_TARGET = 'http://localhost:8080'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_PROXY_TARGET || DEFAULT_DEV_PROXY_TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      rollupOptions: {
        output: {
          /*
           * Keep Leaflet out of the initial discovery-list chunk (PRD 14.1) and
           * separate the long-lived framework code from application code so a
           * deploy does not invalidate everything.
           */
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('leaflet')) return 'map-vendor'
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor'
            if (id.includes('@tanstack')) return 'query-vendor'
            if (id.includes('react-router')) return 'router-vendor'
            return undefined
          },
        },
      },
    },
  }
})
