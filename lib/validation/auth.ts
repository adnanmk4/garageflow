import { z } from "zod";

export const registerSchema = z.object({
  workshopName: z.string().trim().min(2, "Workshop name is too short"),
  ownerName: z.string().trim().min(2, "Name is too short"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(15, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  phone: z.string().trim().min(10, "Enter a valid phone number"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
