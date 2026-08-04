/**
 * Minimal structured logger. Right now this just writes consistently
 * formatted JSON to stderr (which Vercel and most hosts already collect
 * and let you search), but it exists as a single seam: wiring up a real
 * error-monitoring service (Sentry, Logtail, Axiom, etc.) before launch
 * means changing the inside of `logError`, not every call site across the
 * codebase.
 *
 * Deliberately does not log request bodies or full stack traces to
 * anything other than stderr — no third-party service is configured here,
 * so there's nowhere else for that data to go yet.
 */

interface LogContext {
  route?: string;
  workshopId?: string;
  userId?: string;
  [key: string]: unknown;
}

export function logError(message: string, error: unknown, context: LogContext = {}) {
  const errorInfo =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };

  console.error(
    JSON.stringify({
      level: "error",
      message,
      error: errorInfo,
      context,
      timestamp: new Date().toISOString(),
    })
  );
}
