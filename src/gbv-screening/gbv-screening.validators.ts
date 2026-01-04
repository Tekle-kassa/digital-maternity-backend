import { z } from "zod";

export const gbvScreeningSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  recordedById: z.string().min(1, "Recorded by ID is required"),
  gbvReportId: z.string().optional(),

  // Consent
  survivorConsentSignature: z.string().optional(),
  caseWorkerConsentSignature: z.string().optional(),

  // Comprehensive GBV History
  gbvHistory: z.string().optional(),

  // Vital Signs
  temperature: z.string().optional(),
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
  smartUltrasoundRecommendation: z.string().optional(),

  // Treatment Plan
  treatmentPlan: z.string().optional(),
  treatmentRx: z.string().optional(),
  continuationSheet: z.string().optional(),
});
