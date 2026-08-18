/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_MAP_TILE_URL?: string
  readonly VITE_MAP_TILE_URL_DARK?: string
  readonly VITE_MAP_ATTRIBUTION?: string
  readonly VITE_MAP_LINK_PROVIDER?: 'google' | 'apple' | 'openstreetmap' | 'bing'
  readonly VITE_DEV_API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * Injected by the container entrypoint (see docker/entrypoint.sh) into
 * public/config.js, which index.html loads before the app bundle. Absent in
 * dev/test, where the checked-in public/config.js stub sets it to `{}` and
 * build-time `import.meta.env` fallbacks apply instead. See
 * src/shared/config/env.ts and frontend-cd/README.md.
 */
interface Window {
  __APP_CONFIG__?: Record<string, string>
}
