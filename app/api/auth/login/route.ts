import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import User from "@/models/User";
import { signSessionToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { tooManyRequests } from "@/lib/security/tooManyRequests";
import { logError } from "@/lib/logging/logger";

// 10 attempts per 5 minutes per IP — generous enough for a mechanic who
// fat-fingers a password twice, tight enough to blunt a brute-force sweep.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`login:${getClientIp(request)}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!rateLimit.allowed) return tooManyRequests(rateLimit);

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { phone, password } = parsed.data;

    await connectDB();

    // Phone is unique per-workshop, not globally, so in theory the same
    // phone could exist at multiple workshops (e.g. an employee who later
    // opens their own shop). For MVP we match the first active account
    // found; a "which workshop?" picker is a fast follow if this becomes
    // a real collision in practice.
    const user = await User.findOne({ phone, isActive: true });

    if (!user) {
      return NextResponse.json({ error: "Invalid phone number or password." }, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json({ error: "Invalid phone number or password." }, { status: 401 });
    }

    const token = signSessionToken({
      userId: user._id.toString(),
      workshopId: user.workshopId.toString(),
      role: user.role as "owner" | "employee",
    });

    const response = NextResponse.json({
      user: { id: user._id, name: user.name, role: user.role },
    });
    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (err) {
    logError("Login failed unexpectedly", err, { route: "auth/login" });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
