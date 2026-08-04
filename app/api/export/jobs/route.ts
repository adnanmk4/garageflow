import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Job from "@/models/Job";
import { getRequestIdentity, assertOwner } from "@/lib/auth/requestIdentity";

export async function GET() {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  try {
    assertOwner(identity);
  } catch {
    return NextResponse.json({ error: "Only the workshop owner can export data." }, { status: 403 });
  }

  await connectDB();
  const jobs = await Job.find({ workshopId: identity.workshopId })
    .sort({ createdAt: 1 })
    .populate("vehicleId", "regNumber")
    .populate("customerId", "name phone")
    .lean();

  const header = [
    "Date",
    "Vehicle",
    "Customer",
    "Phone",
    "Services",
    "Parts Total",
    "Labor Total",
    "Discount",
    "Grand Total",
    "Paid",
    "Balance Remaining",
    "Payment Status",
  ];

  const rows = jobs.map((job) => [
    new Date(job.createdAt).toISOString().slice(0, 10),
    (job.vehicleId as { regNumber?: string } | null)?.regNumber ?? "",
    (job.customerId as { name?: string } | null)?.name ?? "",
    (job.customerId as { phone?: string } | null)?.phone ?? "",
    job.services.map((s: { name: string }) => s.name).join("; "),
    job.partsTotal,
    job.laborTotal,
    job.discount,
    job.grandTotal,
    job.paidAmount,
    job.balanceRemaining,
    job.paymentStatus,
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="garageflow-jobs-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csvEscape(value: unknown): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
