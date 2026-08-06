import { NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { getDashboardSummary } from "@/lib/dashboard/getSummary";

export const revalidate = 15;

export async function GET() {
  const identity = await getRequestIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const summary = await getDashboardSummary(identity.workshopId);
  return NextResponse.json(summary);
}
