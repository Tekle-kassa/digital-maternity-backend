import { z } from "zod";

export const srhRegistrationSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  recordedById: z.string().min(1).optional(), // Set from auth if omitted

  // Consent (Screen 1)
  clientConsentSignature: z.string().optional(),
  healthProfessionalConsentSignature: z.string().optional(),

  // History (Screen 3)
  srhServiceType: z.string().optional(), // Family Planning, Routine Care, STI/HIV, Others
  history: z.string().optional(),

  // Vital Signs (Screen 4)
  temperature: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined ? undefined : String(v))),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  bmiIndex: z.number().positive().optional(),
  bloodPressure: z.string().optional(),
  pulse: z.string().optional(),
  respiratoryRate: z.string().optional(),
  oxygenSaturation: z.string().optional(),

  // Physical Examination
  physicalExamination: z.string().optional(),

  // Working Diagnosis
  workingDiagnosis: z.string().optional(),

  // Laboratory
  laboratoryResults: z.string().optional(),

  // Ultrasound Request
  typeOfUltrasound: z.string().optional(),
  ultrasoundMore: z.string().optional(),
  smartUltrasoundRecommendation: z.string().optional(),

  // Treatment Plan
  treatmentPlan: z.string().optional(),
  treatmentRx: z.string().optional(),
  continuationSheet: z.string().optional(),
});
