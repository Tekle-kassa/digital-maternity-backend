import { z } from "zod";
import { ancRecordSchema } from "../anc/anc.validators";

export const patientSchema = z.object({
  fullName: z.string().min(3),
  cardNo: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  // dob: z.date().optional(),
  age: z.number().optional(),
  // age: z.number().min(1),
  address: z.string().optional(),
  subCity: z.string().optional(),
  woreda: z.string().optional(),
  kebele: z.string().optional(),
  houseNo: z.string().optional(),
  facility: z.string().optional(),
  maritalStatus: z.string().optional(),
  idNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export const createPatientSchema = z.object({
  fullName: z.string().min(3),
  cardNo: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  // dob: z.date().optional(),
  age: z.number().optional(),
  // age: z.number().min(1),
  address: z.string().optional(),
  subCity: z.string().optional(),
  woreda: z.string().optional(),
  kebele: z.string().optional(),
  houseNo: z.string().optional(),
  facility: z.string().optional(),
  maritalStatus: z.string().optional(),
  idNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  createdById: z.string(),
});

/** Combined schema for Register Client (full UI form in one request). Omits patientId (set server-side). */
export const registerClientSchema = patientSchema.merge(
  ancRecordSchema.omit({ patientId: true })
);
export type RegisterClientPayload = z.infer<typeof registerClientSchema>;
