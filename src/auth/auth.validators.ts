import { z } from "zod";
export const roleEnum = z.enum([
  "HealthWorker",
  "GBVCounselor",
  "Supervisor",
  "Admin",
]);
export const registerSchema = z.object({
  fullName: z.string().min(4, "username must be at least 4 characters"),
  phone: z.string(),
  password: z.string().min(4, "password must be at least 4 characters"),
  // role: roleEnum,
});

export const loginSchema = z.object({
  phone: z.string(),
  password: z.string().min(4, "password must be at least 4 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(4, "New password must be at least 4 characters"),
});
export const firstTimeChangePasswordSchema = z.object({
  phone: z.string().min(1, "Phone is required"),
  initialPassword: z.string().min(1, "Initial password is required"),
  newPassword: z.string().min(4, "New password must be at least 4 characters"),
});
