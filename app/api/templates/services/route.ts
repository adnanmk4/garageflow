import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import ServiceTemplate from "@/models/ServiceTemplate";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";

export async function GET() {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  await connectDB();
  const templates = await ServiceTemplate.find({
    workshopId: identity.workshopId,
    isActive: true,
  })
    .sort({ isCustom: 1, createdAt: 1 })
    .lean();

  return NextResponse.json({ templates });
}

const createSchema = z.object({ name: z.string().trim().min(1).max(80) });

export async function POST(request: Request) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a service name" }, { status: 400 });
  }

  await connectDB();
  const template = await ServiceTemplate.create({
    workshopId: identity.workshopId,
    name: parsed.data.name,
    isCustom: true,
  });

  return NextResponse.json({ template });
}
