import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Job from "@/models/Job";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const job = await Job.findOne({ _id: id, workshopId: identity.workshopId })
    .populate("vehicleId")
    .populate("customerId")
    .lean();

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({ job });
}
