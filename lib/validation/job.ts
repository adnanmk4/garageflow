import { z } from "zod";

export const serviceLineSchema = z.object({
  templateId: z.string().optional().nullable(),
  name: z.string().trim().min(1),
  notes: z.string().trim().optional().nullable(),
});

export const partLineSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Price can't be negative"),
});

export const laborLineSchema = z.object({
  name: z.string().trim().min(1),
  amount: z.number().min(0, "Amount can't be negative"),
});

export const jobCreateSchema = z.object({
  regNumber: z.string().trim().min(1, "Registration number is required"),
  customerName: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  vehicleBrand: z.string().trim().optional().nullable(),
  vehicleModel: z.string().trim().optional().nullable(),
  mileage: z.number().optional().nullable(),

  services: z.array(serviceLineSchema).default([]),
  parts: z.array(partLineSchema).default([]),
  labor: z.array(laborLineSchema).default([]),

  discount: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
});

export type JobCreateInput = z.infer<typeof jobCreateSchema>;
export type ServiceLine = z.infer<typeof serviceLineSchema>;
export type PartLine = z.infer<typeof partLineSchema>;
export type LaborLine = z.infer<typeof laborLineSchema>;
