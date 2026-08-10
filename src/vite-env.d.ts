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
