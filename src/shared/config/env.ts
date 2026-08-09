/**
 * Environment configuration (PRD 9.1).
 *
 * Required variables are validated at module load. In non-production builds an
 * invalid configuration throws a developer-readable error; in production the
 * app falls back to safe defaults rather than white-screening, and logs once.
 */

export interface AppConfig {
  /** Base URL of the API Gateway. Always normalised without a trailing slash. */
  apiBaseUrl: string
  mapTileUrl: string
  mapAttribution: string
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

  const config: AppConfig = {
    apiBaseUrl: normaliseBaseUrl(rawApiBaseUrl || FALLBACKS.apiBaseUrl),
    mapTileUrl: missing.includes('VITE_MAP_TILE_URL') ? FALLBACKS.mapTileUrl : mapTileUrl,
    mapAttribution: mapAttribution || FALLBACKS.mapAttribution,
  }

  return { config, error: missing.length > 0 ? new ConfigurationError(missing) : null }
}

const resolved = resolveConfig(
  import.meta.env as unknown as Record<string, unknown>,
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
