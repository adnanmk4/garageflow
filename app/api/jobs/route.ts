import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Job from "@/models/Job";
import Vehicle from "@/models/Vehicle";
import Customer from "@/models/Customer";
import Invoice from "@/models/Invoice";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { jobCreateSchema } from "@/lib/validation/job";
import { createJob } from "@/lib/jobs/createJob";
import { normalizeRegNumber } from "@/lib/utils";
import { logError } from "@/lib/logging/logger";

export async function POST(request: Request) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await request.json();
  const parsed = jobCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid job data" },
      { status: 400 }
    );
  }

  try {
    const job = await createJob(parsed.data, identity.workshopId, identity.userId);
    return NextResponse.json({ job });
  } catch (err) {
    logError("Create job failed unexpectedly", err, {
      route: "jobs",
      workshopId: identity.workshopId,
      userId: identity.userId,
    });
    return NextResponse.json(
      { error: "Couldn't save the job. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status")?.trim();

  await connectDB();

  const query: Record<string, unknown> = { workshopId: identity.workshopId };
  if (status) query.status = status;

  let uniqueVehicle: { _id: string; regNumber: string } | null = null;

  if (search) {
    // Search spans vehicle reg number, customer name/phone, and invoice
    // number — the things a mechanic is most likely to remember about a
    // past job (architecture doc, Section "Search").
    const regMatch = normalizeRegNumber(search);
    const [matchingVehicles, matchingCustomers, matchingInvoices] = await Promise.all([
      Vehicle.find({
        workshopId: identity.workshopId,
        regNumber: { $regex: escapeRegex(regMatch), $options: "i" },
      }).select("_id regNumber"),
      Customer.find({
        workshopId: identity.workshopId,
        $or: [
          { name: { $regex: escapeRegex(search), $options: "i" } },
          { phone: { $regex: escapeRegex(search), $options: "i" } },
        ],
      }).select("_id"),
      Invoice.find({
        workshopId: identity.workshopId,
        invoiceNumber: { $regex: escapeRegex(search), $options: "i" },
      }).select("jobId"),
    ]);

    const vehicleIds = matchingVehicles.map((v) => v._id);
    const customerIds = matchingCustomers.map((c) => c._id);
    const jobIdsFromInvoices = matchingInvoices.map((i) => i.jobId);

    // If the search text uniquely identifies one vehicle, surface it so the
    // UI can offer a "view full history" shortcut straight to that vehicle's
    // timeline rather than just a flat list of matching jobs.
    if (matchingVehicles.length === 1) {
      uniqueVehicle = { _id: matchingVehicles[0]._id.toString(), regNumber: matchingVehicles[0].regNumber };
    }

    if (vehicleIds.length === 0 && customerIds.length === 0 && jobIdsFromInvoices.length === 0) {
      return NextResponse.json({ jobs: [], uniqueVehicle: null });
    }

    query.$or = [
      { vehicleId: { $in: vehicleIds } },
      { customerId: { $in: customerIds } },
      { _id: { $in: jobIdsFromInvoices } },
    ];
  }

  const jobs = await Job.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("vehicleId", "regNumber")
    .populate("customerId", "name phone")
    .lean();

  return NextResponse.json({ jobs, uniqueVehicle });
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
