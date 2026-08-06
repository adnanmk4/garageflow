import { unstable_cache } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Job from "@/models/Job";
import Vehicle from "@/models/Vehicle";

export interface DashboardSummary {
  todayJobs: number;
  pendingJobs: number;
  completedJobs: number;
  revenueToday: number;
  revenueMonth: number;
  outstanding: number;
  recentJobs: Array<{
    _id: string;
    status: string;
    grandTotal: number;
    paymentStatus: string;
    createdAt: string;
    vehicleId?: { regNumber?: string } | null;
  }>;
}

async function loadDashboardSummary(workshopId: string): Promise<DashboardSummary> {
  await connectDB();

  const workshopObjectId = new Types.ObjectId(workshopId);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

  const [summaryResult] = await Job.aggregate([
    { $match: { workshopId: workshopObjectId } },
    {
      $facet: {
        todayJobs: [{ $match: { createdAt: { $gte: startOfToday } } }, { $count: "count" }],
        pendingJobs: [{ $match: { status: { $in: ["draft", "in_progress"] } } }, { $count: "count" }],
        completedJobs: [{ $match: { status: "completed" } }, { $count: "count" }],
        revenueToday: [{ $match: { createdAt: { $gte: startOfToday } } }, { $group: { _id: null, total: { $sum: "$paidAmount" } } }],
        revenueMonth: [{ $match: { createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: "$paidAmount" } } }],
        outstanding: [{ $match: { paymentStatus: { $in: ["partial", "pending"] } } }, { $group: { _id: null, total: { $sum: "$balanceRemaining" } } }],
      },
    },
  ]);

  const recentJobs = await Job.find({ workshopId: workshopObjectId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("_id status grandTotal paymentStatus createdAt vehicleId")
    .lean();

  const vehicleIds = recentJobs.flatMap((job) => (job.vehicleId ? [String(job.vehicleId)] : []));
  const vehicles = vehicleIds.length
    ? await Vehicle.find({ _id: { $in: vehicleIds } }).select("regNumber").lean()
    : [];

  const vehiclesById = new Map(vehicles.map((vehicle) => [String(vehicle._id), vehicle]));

  return {
    todayJobs: summaryResult.todayJobs[0]?.count ?? 0,
    pendingJobs: summaryResult.pendingJobs[0]?.count ?? 0,
    completedJobs: summaryResult.completedJobs[0]?.count ?? 0,
    revenueToday: summaryResult.revenueToday[0]?.total ?? 0,
    revenueMonth: summaryResult.revenueMonth[0]?.total ?? 0,
    outstanding: summaryResult.outstanding[0]?.total ?? 0,
    recentJobs: recentJobs.map((job) => ({
      _id: String(job._id),
      status: job.status,
      grandTotal: job.grandTotal ?? 0,
      paymentStatus: job.paymentStatus,
      createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
      vehicleId: job.vehicleId
        ? { regNumber: vehiclesById.get(String(job.vehicleId))?.regNumber }
        : null,
    })),
  };
}

const getCachedDashboardSummary = unstable_cache(
  async (workshopId: string) => loadDashboardSummary(workshopId),
  ["dashboard-summary"],
  { revalidate: 15, tags: ["dashboard-summary"] }
);

export async function getDashboardSummary(workshopIdStr: string): Promise<DashboardSummary> {
  return getCachedDashboardSummary(workshopIdStr);
}
