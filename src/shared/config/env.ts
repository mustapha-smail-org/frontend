/**
 * Environment configuration (PRD 9.1).
 *
 * Required variables are validated at module load. In non-production builds an
 * invalid configuration throws a developer-readable error; in production the
 * app falls back to safe defaults rather than white-screening, and logs once.
 */

/**
 * Which external mapping service the "Open in Maps" actions link to.
 * Deliberately configurable rather than hardcoded (see `map-links.ts`).
 */
export const MAP_LINK_PROVIDERS = ['google', 'apple', 'openstreetmap', 'bing'] as const
export type MapLinkProvider = (typeof MAP_LINK_PROVIDERS)[number]

export const DEFAULT_MAP_LINK_PROVIDER: MapLinkProvider = 'google'

export interface AppConfig {
  /** Base URL of the API Gateway. Always normalised without a trailing slash. */
  apiBaseUrl: string
  mapTileUrl: string
  /** Optional dark tile set. Falls back to `mapTileUrl` when not supplied. */
  mapTileUrlDark: string
  mapAttribution: string
  mapLinkProvider: MapLinkProvider
}

export class ConfigurationError extends Error {
  readonly missing: string[]

  constructor(missing: string[]) {
    super(
      `CityPulse is misconfigured. Missing or invalid environment variables: ${missing.join(
        ', '
      )}. Copy .env.example to .env and fill them in.`
    )
    this.name = 'ConfigurationError'
    this.missing = missing
  }
}

const FALLBACKS = {
  apiBaseUrl: '',
  mapTileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  mapAttribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
} as const

function isMapLinkProvider(value: string): value is MapLinkProvider {
  return (MAP_LINK_PROVIDERS as readonly string[]).includes(value)
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Strips a trailing slash so callers can always join with a leading-slash path. */
function normaliseBaseUrl(value: string): string {
  if (value === '' || value === '/') return ''
  return value.replace(/\/+$/, '')
}

export function resolveConfig(
  source: Record<string, unknown>,
  isProduction: boolean
): { config: AppConfig; error: ConfigurationError | null } {
  const missing: string[] = []

  // An empty VITE_API_BASE_URL is legitimate: it means "same origin", which is
  // how the Vite dev proxy and a co-hosted gateway both work.
  const rawApiBaseUrl = readString(source.VITE_API_BASE_URL)
  if (isProduction && rawApiBaseUrl === '') {
    missing.push('VITE_API_BASE_URL')
  }

  const mapTileUrl = readString(source.VITE_MAP_TILE_URL)
  if (!mapTileUrl.includes('{z}') || !mapTileUrl.includes('{x}') || !mapTileUrl.includes('{y}')) {
    missing.push('VITE_MAP_TILE_URL')
  }

  const mapAttribution = readString(source.VITE_MAP_ATTRIBUTION)
  if (mapAttribution === '') {
    missing.push('VITE_MAP_ATTRIBUTION')
  }

  // Optional: a deployment with only one tile set simply omits this.
  const rawDarkTileUrl = readString(source.VITE_MAP_TILE_URL_DARK)
  const darkTileUrlIsUsable =
    rawDarkTileUrl.includes('{z}') &&
    rawDarkTileUrl.includes('{x}') &&
    rawDarkTileUrl.includes('{y}')

  /*
   * An unrecognised provider is a typo, not a reason to break the page: warn in
   * the configuration error and fall back to the default.
   */
  const rawLinkProvider = readString(source.VITE_MAP_LINK_PROVIDER).toLowerCase()
  if (rawLinkProvider !== '' && !isMapLinkProvider(rawLinkProvider)) {
    missing.push('VITE_MAP_LINK_PROVIDER')
  }

  const effectiveTileUrl = missing.includes('VITE_MAP_TILE_URL') ? FALLBACKS.mapTileUrl : mapTileUrl

  const config: AppConfig = {
    apiBaseUrl: normaliseBaseUrl(rawApiBaseUrl || FALLBACKS.apiBaseUrl),
    mapTileUrl: effectiveTileUrl,
    mapTileUrlDark: darkTileUrlIsUsable ? rawDarkTileUrl : effectiveTileUrl,
    mapAttribution: mapAttribution || FALLBACKS.mapAttribution,
    mapLinkProvider: isMapLinkProvider(rawLinkProvider)
      ? rawLinkProvider
      : DEFAULT_MAP_LINK_PROVIDER,
  }

  return { config, error: missing.length > 0 ? new ConfigurationError(missing) : null }
}

/**
 * Merges runtime config (from `window.__APP_CONFIG__`, injected by the
 * container entrypoint at deploy time) over build-time `import.meta.env`
 * fallbacks. Runtime wins so a single built image can be promoted through
 * every environment without a rebuild — see frontend-cd/README.md.
 */
export function mergeRuntimeConfig(
  buildTimeEnv: Record<string, unknown>,
  runtimeConfig: Record<string, unknown> | undefined
): Record<string, unknown> {
  return { ...buildTimeEnv, ...runtimeConfig }
}

const resolved = resolveConfig(
  mergeRuntimeConfig(
    import.meta.env as unknown as Record<string, unknown>,
    globalThis.window?.__APP_CONFIG__
  ),
  import.meta.env.PROD
)

if (resolved.error) {
  if (import.meta.env.PROD) {
    console.error(resolved.error.message)
  } else if (!import.meta.env.MODE.includes('test')) {
    throw resolved.error
  }
}

export const config: AppConfig = resolved.config
