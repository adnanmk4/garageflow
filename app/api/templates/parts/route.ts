import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import PartCatalog from "@/models/PartCatalog";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";

export async function GET(request: Request) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();

  await connectDB();

  const query: Record<string, unknown> = { workshopId: identity.workshopId };
  if (search) {
    query.name = { $regex: escapeRegex(search), $options: "i" };
  }

  const parts = await PartCatalog.find(query).sort({ isCustom: 1, name: 1 }).limit(15).lean();
  return NextResponse.json({ parts });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  defaultPrice: z.number().min(0).optional().nullable(),
});

export async function POST(request: Request) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a part name" }, { status: 400 });
  }

  await connectDB();
  const part = await PartCatalog.create({
    workshopId: identity.workshopId,
    name: parsed.data.name,
    defaultPrice: parsed.data.defaultPrice ?? null,
    isCustom: true,
  });

  return NextResponse.json({ part });
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
