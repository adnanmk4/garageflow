import { NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { getVehicleHistory } from "@/lib/vehicles/getVehicleHistory";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const result = await getVehicleHistory(id, identity.workshopId);

  if (!result) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  return NextResponse.json(result);
}
