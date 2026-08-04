import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/models/User";
import Workshop from "@/models/Workshop";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";

export async function GET() {
  const identity = await getRequestIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  await connectDB();

  const [user, workshop] = await Promise.all([
    User.findById(identity.userId).select("name phone role preferredLanguage"),
    Workshop.findById(identity.workshopId).select(
      "name logoUrl currency language invoicePrefix"
    ),
  ]);

  if (!user || !workshop) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ user, workshop });
}
