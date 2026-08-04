/**
 * In-memory, fixed-window rate limiter.
 *
 * Honest limitation: this state lives in the Node process's memory, so it
 * resets on every cold start and is NOT shared across multiple serverless
 * instances. On Vercel specifically, that means a determined attacker
 * spread across enough concurrent invocations could exceed these limits in
 * aggregate. This is a real, meaningful floor against casual abuse and
 * accidental retry storms — but before a real public launch, swap this for
 * a shared store (Upstash Redis + @upstash/ratelimit is the standard
 * pairing with Vercel, and is a drop-in replacement for the `check()`
 * function below).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically sweep expired buckets so this Map doesn't grow unbounded
// across a long-running process.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  },
  5 * 60 * 1000
).unref?.();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Best-effort client IP extraction behind a proxy (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
