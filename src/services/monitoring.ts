import * as Sentry from "@sentry/react";

// Error monitoring is entirely optional: unset VITE_SENTRY_DSN and this
// module no-ops everywhere, so local dev and any deployment that hasn't
// configured a Sentry project keep working exactly as before.
const dsn = import.meta.env.VITE_SENTRY_DSN;

export function initMonitoring(): void {
  if (!dsn || import.meta.env.DEV) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Keep this dependency-light: no session replay or performance
    // integrations until there's an actual need for them.
    tracesSampleRate: 0,
  });
}

export function captureError(
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  if (!dsn || import.meta.env.DEV) return;

  Sentry.captureException(error, extra ? { extra } : undefined);
}
