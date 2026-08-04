import { headers } from "next/headers";

export interface RequestIdentity {
  userId: string;
  workshopId: string;
  role: "owner" | "employee";
}

/**
 * Reads the identity that middleware.ts already verified and attached as
 * headers. Route Handlers use this instead of re-verifying the JWT
 * themselves — one place decodes the token, everywhere else just trusts
 * the request headers within this same request lifecycle.
 */
export async function getRequestIdentity(): Promise<RequestIdentity | null> {
  const h = await headers();
  const userId = h.get("x-user-id");
  const workshopId = h.get("x-workshop-id");
  const role = h.get("x-user-role") as "owner" | "employee" | null;

  if (!userId || !workshopId || !role) return null;
  return { userId, workshopId, role };
}

export async function requireIdentity(): Promise<RequestIdentity> {
  const identity = await getRequestIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");
  return identity;
}

/** Throws if the caller isn't an owner — use in owner-only route handlers. */
export function assertOwner(identity: RequestIdentity) {
  if (identity.role !== "owner") {
    throw new Error("FORBIDDEN");
  }
}
