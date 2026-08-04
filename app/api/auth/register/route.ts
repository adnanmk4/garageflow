import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import Workshop from "@/models/Workshop";
import User from "@/models/User";
import ServiceTemplate, { DEFAULT_SERVICE_TEMPLATES } from "@/models/ServiceTemplate";
import PartCatalog, { DEFAULT_PARTS } from "@/models/PartCatalog";
import { signSessionToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validation/auth";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { tooManyRequests } from "@/lib/security/tooManyRequests";
import { logError } from "@/lib/logging/logger";

// Registration is rarer and heavier (creates a workshop + seeds data), so
// the limit is tighter than login.
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`register:${getClientIp(request)}`, REGISTER_LIMIT, REGISTER_WINDOW_MS);
  if (!rateLimit.allowed) return tooManyRequests(rateLimit);

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { workshopName, ownerName, phone, password } = parsed.data;

    await connectDB();

    // A phone number is unique per-workshop (see User model), so we only
    // need to check for a clash on the workshop we're about to create —
    // which can't exist yet — so no pre-check is needed here.

    const workshop = await Workshop.create({ name: workshopName });

    const passwordHash = await bcrypt.hash(password, 10);
    const owner = await User.create({
      workshopId: workshop._id,
      name: ownerName,
      phone,
      passwordHash,
      role: "owner",
    });

    // Seed default service chips and common parts so the workshop isn't
    // staring at an empty "New Job" screen on day one.
    await ServiceTemplate.insertMany(
      DEFAULT_SERVICE_TEMPLATES.map((t) => ({ ...t, workshopId: workshop._id }))
    );
    await PartCatalog.insertMany(
      DEFAULT_PARTS.map((name) => ({ name, workshopId: workshop._id }))
    );

    const token = signSessionToken({
      userId: owner._id.toString(),
      workshopId: workshop._id.toString(),
      role: "owner",
    });

    const response = NextResponse.json({
      user: { id: owner._id, name: owner.name, role: owner.role },
      workshop: { id: workshop._id, name: workshop.name },
    });
    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (err: unknown) {
    // Duplicate phone within the (brand new) workshop can't actually happen
    // here, but a duplicate key error from a race is still possible — surface
    // it as a clean 409 rather than a raw Mongo error.
    if (typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "That phone number is already registered." }, { status: 409 });
    }
    logError("Register failed unexpectedly", err, { route: "auth/register" });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
