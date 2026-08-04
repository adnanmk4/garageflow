import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/models/User";
import { getRequestIdentity, assertOwner } from "@/lib/auth/requestIdentity";
import { updateUserSchema } from "@/lib/validation/settings";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  try {
    assertOwner(identity);
  } catch {
    return NextResponse.json({ error: "Only the workshop owner can manage users." }, { status: 403 });
  }

  const { id } = await params;

  // An owner can't lock themselves out or demote themselves with no one
  // left to manage the workshop — simplest safe rule for MVP: owners can't
  // edit their own account through this endpoint at all.
  if (id === identity.userId) {
    return NextResponse.json({ error: "You can't change your own account here." }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOneAndUpdate(
    { _id: id, workshopId: identity.workshopId },
    parsed.data,
    { new: true }
  ).select("name phone role isActive");

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ user });
}
