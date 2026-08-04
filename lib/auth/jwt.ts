import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Add it to your .env.local (see .env.example).");
}

export interface SessionPayload {
  userId: string;
  workshopId: string;
  role: "owner" | "employee";
}

// 7 days: shop phones are often shared/left logged in on purpose, so we
// balance security against real usage rather than forcing daily re-logins.
const TOKEN_TTL = "7d";

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: TOKEN_TTL });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as SessionPayload;
  } catch {
    return null;
  }
}
