import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Job from "@/models/Job";

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

export async function getDashboardSummary(workshopIdStr: string): Promise<DashboardSummary> {
  await connectDB();

  const workshopId = new Types.ObjectId(workshopIdStr);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

  const [todayJobs, pendingJobs, completedJobs, revenueToday, revenueMonth, outstanding, recentJobs] =
    await Promise.all([
      Job.countDocuments({ workshopId, createdAt: { $gte: startOfToday } }),
      Job.countDocuments({ workshopId, status: { $in: ["draft", "in_progress"] } }),
      Job.countDocuments({ workshopId, status: "completed" }),
      Job.aggregate([
        { $match: { workshopId, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$paidAmount" } } },
      ]),
      Job.aggregate([
        { $match: { workshopId, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$paidAmount" } } },
      ]),
      Job.aggregate([
        { $match: { workshopId, paymentStatus: { $in: ["partial", "pending"] } } },
        { $group: { _id: null, total: { $sum: "$balanceRemaining" } } },
      ]),
      Job.find({ workshopId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("vehicleId", "regNumber")
        .lean(),
    ]);

  return {
    todayJobs,
    pendingJobs,
    completedJobs,
    revenueToday: revenueToday[0]?.total ?? 0,
    revenueMonth: revenueMonth[0]?.total ?? 0,
    outstanding: outstanding[0]?.total ?? 0,
    recentJobs: JSON.parse(JSON.stringify(recentJobs)),
  };
}
