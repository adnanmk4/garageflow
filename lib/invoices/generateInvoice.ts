import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Job from "@/models/Job";
import Vehicle from "@/models/Vehicle";
import Customer from "@/models/Customer";
import Workshop from "@/models/Workshop";
import Invoice from "@/models/Invoice";
import { getNextInvoiceNumber } from "@/models/Counter";

export interface InvoiceSnapshot {
  workshop: {
    name: string;
    logoUrl: string | null;
    phone: string | null;
    address: string | null;
    currency: string;
    receiptFooter: string;
    taxEnabled: boolean;
    taxPercent: number;
  };
  vehicle: {
    regNumber: string;
    brand: string | null;
    model: string | null;
    mileage: number | null;
  };
  customer: { name: string | null; phone: string | null } | null;
  job: {
    services: Array<{ name: string; notes: string | null }>;
    parts: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }>;
    labor: Array<{ name: string; amount: number }>;
    partsTotal: number;
    laborTotal: number;
    discount: number;
    taxAmount: number;
    grandTotal: number;
    paidAmount: number;
    balanceRemaining: number;
    paymentStatus: string;
    createdAt: string;
  };
}

export class InvoiceError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/**
 * Generates an invoice for a completed job. Idempotent by design: calling
 * this twice for the same job returns the existing invoice rather than
 * minting a second invoice number for the same work — a mechanic tapping
 * "Generate Invoice" twice (slow network, accidental double-tap) must never
 * burn two sequence numbers on one job.
 */
export async function generateInvoiceForJob(jobId: string, workshopIdStr: string) {
  await connectDB();

  const workshopId = new Types.ObjectId(workshopIdStr);
  const job = await Job.findOne({ _id: jobId, workshopId });
  if (!job) throw new InvoiceError("Job not found", 404);

  if (job.invoiceId) {
    const existing = await Invoice.findById(job.invoiceId);
    if (existing) return existing;
    // invoiceId pointed at a deleted invoice — fall through and mint a new one
  }

  const [vehicle, customer, workshop] = await Promise.all([
    Vehicle.findById(job.vehicleId),
    job.customerId ? Customer.findById(job.customerId) : null,
    Workshop.findById(workshopId),
  ]);

  if (!vehicle || !workshop) throw new InvoiceError("Workshop or vehicle data missing", 500);

  const invoiceNumber = await getNextInvoiceNumber(workshopId, workshop.invoicePrefix || "INV");

  const snapshot: InvoiceSnapshot = {
    workshop: {
      name: workshop.name,
      logoUrl: workshop.logoUrl ?? null,
      phone: workshop.phone ?? null,
      address: workshop.address ?? null,
      currency: workshop.currency,
      receiptFooter: workshop.receiptFooter,
      taxEnabled: workshop.taxEnabled,
      taxPercent: workshop.taxPercent,
    },
    vehicle: {
      regNumber: vehicle.regNumber,
      brand: vehicle.brand ?? null,
      model: vehicle.model ?? null,
      mileage: vehicle.mileage ?? null,
    },
    customer: customer ? { name: customer.name ?? null, phone: customer.phone ?? null } : null,
    job: {
      services: job.services.map((s: { name: string; notes?: string | null }) => ({ name: s.name, notes: s.notes ?? null })),
      parts: job.parts.map((p: { name: string; quantity: number; unitPrice: number; subtotal: number }) => ({
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        subtotal: p.subtotal,
      })),
      labor: job.labor.map((l: { name: string; amount: number }) => ({ name: l.name, amount: l.amount })),
      partsTotal: job.partsTotal,
      laborTotal: job.laborTotal,
      discount: job.discount,
      taxAmount: job.taxAmount,
      grandTotal: job.grandTotal,
      paidAmount: job.paidAmount,
      balanceRemaining: job.balanceRemaining,
      paymentStatus: job.paymentStatus,
      createdAt: job.createdAt.toISOString(),
    },
  };

  const invoice = await Invoice.create({
    workshopId,
    jobId: job._id,
    invoiceNumber,
    snapshot,
  });

  job.invoiceId = invoice._id;
  await job.save();

  return invoice;
}
