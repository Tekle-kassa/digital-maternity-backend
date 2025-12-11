import { z } from "zod";

export const ultrasoundSchema = z.object({
  patientId: z.string(),
  visitId: z.string().optional(),
  imageUrl: z.string().nonempty(),
  annotations: z.string().optional(),
  description: z.string().optional(),
  gestationalAge: z.number().optional(),
});
