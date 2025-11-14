import { z } from "zod";
export const roleEnum = z.enum([
  "HealthWorker",
  "GBVCounselor",
  "Supervisor",
  "Admin",
]);
export const registerSchema = z.object({
  username: z.string().min(4, "username must be at least 4 characters"),
  pin: z.string().min(4, "PIN must be at least 4 characters"),
  role: roleEnum,
});

export const loginSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters"),
  pin: z.string().min(4, "PIN must be at least 4 characters"),
});
