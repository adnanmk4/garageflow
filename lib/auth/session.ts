import { cookies } from "next/headers";
import { verifySessionToken, type SessionPayload } from "./jwt";

export const SESSION_COOKIE_NAME = "gf_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days, matches TOKEN_TTL in jwt.ts
};

/**
 * Reads and verifies the session cookie in a Server Component / Route
 * Handler context. Returns null if missing or invalid — callers decide
 * whether that means "redirect to login" or "401".
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Throws-free helper for API routes that require auth. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}
