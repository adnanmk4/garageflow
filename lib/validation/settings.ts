import { z } from "zod";

export const settingsUpdateSchema = z.object({
  name: z.string().trim().min(2, "Workshop name is too short"),
  logoUrl: z.string().trim().max(2_000_000).optional().nullable(), // data URI, capped well under Mongo's 16MB doc limit
  phone: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  invoicePrefix: z
    .string()
    .trim()
    .min(1, "Invoice prefix is required")
    .max(10, "Keep the prefix short")
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers, and dashes only"),
  currency: z.string().trim().min(1).max(6),
  receiptFooter: z.string().trim().max(300).optional().default(""),
  taxEnabled: z.boolean().default(false),
  taxPercent: z.number().min(0).max(100).default(0),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  phone: z.string().trim().min(10, "Enter a valid phone number").max(15),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["owner", "employee"]).default("employee"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["owner", "employee"]).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
