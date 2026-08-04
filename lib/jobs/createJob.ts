import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Vehicle from "@/models/Vehicle";
import Customer from "@/models/Customer";
import Job from "@/models/Job";
import { computeJobTotals } from "@/lib/jobs/computeTotals";
import { normalizeRegNumber } from "@/lib/utils";
import type { JobCreateInput } from "@/lib/validation/job";

export async function createJob(
  input: JobCreateInput,
  workshopIdStr: string,
  userIdStr: string
) {
  await connectDB();

  const workshopId = new Types.ObjectId(workshopIdStr);
  const createdBy = new Types.ObjectId(userIdStr);
  const regNumber = normalizeRegNumber(input.regNumber);

  // Find-or-create the vehicle. Registration number is the anchor entity —
  // a vehicle keeps its job history even if the customer attached to it
  // changes over time (resold car, walk-in correction, etc).
  let vehicle = await Vehicle.findOne({ workshopId, regNumber });
  if (vehicle) {
    // Fill in any newly-provided details without clobbering existing ones
    // with blanks (a mechanic on a follow-up visit might type less, not more).
    if (input.vehicleBrand) vehicle.brand = input.vehicleBrand;
    if (input.vehicleModel) vehicle.model = input.vehicleModel;
    if (typeof input.mileage === "number") vehicle.mileage = input.mileage;
    await vehicle.save();
  } else {
    vehicle = await Vehicle.create({
      workshopId,
      regNumber,
      brand: input.vehicleBrand || null,
      model: input.vehicleModel || null,
      mileage: input.mileage ?? null,
    });
  }

  // Find-or-create the customer. Phone is the more reliable match key than
  // name (typos, nicknames); fall back to creating a name-only record if no
  // phone was given at all.
  let customer = null;
  if (input.phone) {
    customer = await Customer.findOne({ workshopId, phone: input.phone });
    if (customer) {
      if (input.customerName) customer.name = input.customerName;
    } else {
      customer = await Customer.create({
        workshopId,
        name: input.customerName || null,
        phone: input.phone,
      });
    }
  } else if (input.customerName) {
    customer = await Customer.create({ workshopId, name: input.customerName, phone: null });
  }
  if (customer && customer.isModified?.()) await customer.save();

  const totals = computeJobTotals(input.parts, input.labor, input.discount, input.paidAmount);

  const job = await Job.create({
    workshopId,
    vehicleId: vehicle._id,
    customerId: customer?._id ?? null,
    status: "completed",
    createdBy,
    services: input.services.map((s) => ({
      templateId: s.templateId ? new Types.ObjectId(s.templateId) : null,
      name: s.name,
      notes: s.notes || null,
    })),
    parts: totals.partsWithSubtotal,
    labor: input.labor,
    partsTotal: totals.partsTotal,
    laborTotal: totals.laborTotal,
    discount: input.discount,
    grandTotal: totals.grandTotal,
    paidAmount: input.paidAmount,
    balanceRemaining: totals.balanceRemaining,
    paymentStatus: totals.paymentStatus,
  });

  return job;
}
