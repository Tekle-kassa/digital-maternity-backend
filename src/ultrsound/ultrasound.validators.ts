import { z } from "zod";

export const ultrasoundSchema = z.object({
  patientId: z.string().uuid(),
  ancVisitId: z.string().uuid().optional(),
  imageFilePath: z.string().nonempty(),
  scanDate: z.string().nonempty(), // parse as date in controller
  annotations: z.string().optional(),
});
