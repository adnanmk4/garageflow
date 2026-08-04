import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Workshop from "@/models/Workshop";
import { getRequestIdentity, assertOwner } from "@/lib/auth/requestIdentity";
import { settingsUpdateSchema } from "@/lib/validation/settings";

export async function GET() {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  await connectDB();
  const workshop = await Workshop.findById(identity.workshopId).lean();
  if (!workshop) return NextResponse.json({ error: "Workshop not found" }, { status: 404 });

  return NextResponse.json({ workshop });
}

export async function PATCH(request: Request) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  try {
    assertOwner(identity);
  } catch {
    return NextResponse.json({ error: "Only the workshop owner can change settings." }, { status: 403 });
  }

  const parsed = settingsUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid settings" },
      { status: 400 }
    );
  }

  await connectDB();
  const workshop = await Workshop.findByIdAndUpdate(identity.workshopId, parsed.data, {
    new: true,
  }).lean();

  if (!workshop) return NextResponse.json({ error: "Workshop not found" }, { status: 404 });

  return NextResponse.json({ workshop });
}
