/**
 * Error/diagnostics adapter (PRD 18).
 *
 * No external monitoring provider is wired up in the MVP. Everything funnels
 * through this module so a provider can be added in exactly one place, and so
 * production console output stays quiet and free of response bodies.
 */

export interface DiagnosticContext {
  [key: string]: string | number | boolean | null | undefined
}

type Sink = (level: 'warn' | 'error', message: string, context?: DiagnosticContext) => void

const isDev = import.meta.env.DEV

let sink: Sink = (level, message, context) => {
  if (!isDev) return
  if (level === 'error') {
    console.error(`[citypulse] ${message}`, context ?? '')
  } else {
    console.warn(`[citypulse] ${message}`, context ?? '')
  }
}

/** Replace the sink when a monitoring provider is approved. */
export function setDiagnosticsSink(next: Sink): void {
  sink = next
}

/**
 * A backend response violated the documented contract. Logged in development,
 * silent in production — but always routed here so it becomes reportable later.
 */
export function reportContractViolation(message: string, context?: DiagnosticContext): void {
  sink('warn', `contract: ${message}`, context)
}

export function reportUnexpectedError(message: string, context?: DiagnosticContext): void {
  sink('error', message, context)
}
