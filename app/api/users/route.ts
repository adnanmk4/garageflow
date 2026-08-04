import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import User from "@/models/User";
import { getRequestIdentity, assertOwner } from "@/lib/auth/requestIdentity";
import { createUserSchema } from "@/lib/validation/settings";

export async function GET() {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  try {
    assertOwner(identity);
  } catch {
    return NextResponse.json({ error: "Only the workshop owner can view users." }, { status: 403 });
  }

  await connectDB();
  const users = await User.find({ workshopId: identity.workshopId })
    .select("name phone role isActive createdAt")
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  try {
    assertOwner(identity);
  } catch {
    return NextResponse.json({ error: "Only the workshop owner can add users." }, { status: 403 });
  }

  const parsed = createUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid user data" },
      { status: 400 }
    );
  }

  await connectDB();

  const existing = await User.findOne({ workshopId: identity.workshopId, phone: parsed.data.phone });
  if (existing) {
    return NextResponse.json({ error: "A user with that phone number already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await User.create({
    workshopId: identity.workshopId,
    name: parsed.data.name,
    phone: parsed.data.phone,
    passwordHash,
    role: parsed.data.role,
  });

  return NextResponse.json({
    user: { _id: user._id, name: user.name, phone: user.phone, role: user.role, isActive: user.isActive },
  });
}
