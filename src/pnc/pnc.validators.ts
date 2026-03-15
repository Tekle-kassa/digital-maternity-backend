import { z } from "zod";

export const pncVisitSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  deliveryId: z.string().optional(),
  recordedById: z.string().min(1).optional(), // Set from auth if omitted

  // Consent (PNC Medical Recording - Screen 1)
  clientConsentSignature: z.string().optional(),
  healthProfessionalConsentSignature: z.string().optional(),

  visitDate: z.coerce.date().optional(),

  // Postpartum Visit Part 1 (Screen 2)
  bloodPressure: z.string().optional(),
  tpr: z.string().optional(),
  temperature: z.number().optional(),
  uterusContracted: z.string().optional(),
  dribblingLeakingUrine: z.string().optional(),

  // Postpartum Visit Part 2
  anemia: z.string().optional(),
  vaginalDischarge: z.string().optional(),
  breast: z.string().optional(),
  vitaminA: z.string().optional(),
  counselingDangerSigns: z.string().optional(),

  // Postpartum Visit Part 3 - Baby
  babyBreathing: z.string().optional(),
  babyBreastFeeding: z.string().optional(),
  babyWeightGm: z.number().positive().optional(),
  immunization: z.string().optional(),

  // Postpartum Visit Part 4 - HIV
  hivTested: z.string().optional(),
  hivTestResult: z.string().optional(),
  arvPxForMother: z.string().optional(),
  arvPxForNewborn: z.string().optional(),
  feedingOption: z.string().optional(),

  // Postpartum Visit Part 5
  motherReferredToCare: z.string().optional(),
  newbornReferredToCare: z.string().optional(),
  fpCounseledAndProvided: z.string().optional(),
  remark: z.string().optional(),
  actionTaken: z.string().optional(),
});
