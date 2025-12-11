import { z } from "zod";
export const patientSchema = z.object({
  fullName: z.string().min(3),
  phone: z.string().optional(),
  dob: z.date().optional(),
  // age: z.number().min(1),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const createPatientSchema = z.object({
  fullName: z.string().min(3),
  phone: z.string().optional(),
  dob: z.date().optional(),
  // age: z.number().min(1),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  createdById: z.string(),
});
