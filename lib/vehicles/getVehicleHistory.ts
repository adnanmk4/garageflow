import { connectDB } from "@/lib/db/connect";
import Vehicle from "@/models/Vehicle";
import Job from "@/models/Job";

export async function getVehicleHistory(vehicleId: string, workshopId: string) {
  await connectDB();

  const vehicle = await Vehicle.findOne({ _id: vehicleId, workshopId }).lean();
  if (!vehicle) return null;

  const jobs = await Job.find({ vehicleId, workshopId })
    .sort({ createdAt: -1 })
    .populate("customerId", "name phone")
    .lean();

  return { vehicle, jobs };
}
