import { z } from "zod";

export const ancVisitSchema = z.object({
  patientId: z.string().uuid(),
  visitDate: z.string().datetime(),
  gestationalAge: z.number().min(1).max(42),
  bpSystolic: z.number().min(50).max(250),
  bpDiastolic: z.number().min(30).max(150),
  weightKg: z.number().positive(),
  riskScore: z.enum(["Low", "Medium", "High"]),
  healthWorkerNotes: z.string().optional(),
});
