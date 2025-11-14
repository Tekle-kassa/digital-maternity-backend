import { z } from "zod";
export const patientSchema = z.object({
  fullName: z.string().min(3),
  age: z.number().min(1),
  locationGPS: z.string().optional(),
  locationText: z.string().optional(),
  photoUrl: z.string().optional(),
});
