import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Vehicle from "@/models/Vehicle";
import Job from "@/models/Job";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { normalizeRegNumber } from "@/lib/utils";

export async function GET(request: Request) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();

  await connectDB();

  if (!search) return NextResponse.json({ vehicles: [] });

  const regNumber = normalizeRegNumber(search);
  const vehicles = await Vehicle.find({
    workshopId: identity.workshopId,
    regNumber: { $regex: escapeRegex(regNumber), $options: "i" },
  })
    .limit(10)
    .lean();

  // Attach a quick previous-job count per vehicle — this is what powers the
  // "3 previous jobs found" hint on the New Job screen.
  const withJobCounts = await Promise.all(
    vehicles.map(async (v) => ({
      ...v,
      previousJobCount: await Job.countDocuments({ vehicleId: v._id }),
    }))
  );

  return NextResponse.json({ vehicles: withJobCounts });
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
