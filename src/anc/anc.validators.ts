import { z } from "zod";

export const ancRecordSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  // Basic Information (cont'd)
  lmp: z.coerce.date().optional(),
  edd: z.coerce.date().optional(),
  gravida: z.number().int().positive().optional(),
  para: z.number().int().nonnegative().optional(),
  abortion: z.number().int().nonnegative().optional(),
  ectopicPreg: z.number().int().nonnegative().optional(),
  childrenAlive: z.number().int().nonnegative().optional(),

  // General Medical History
  diabetesMellitus: z.boolean().optional(),
  cardiacDisease: z.boolean().optional(),
  chronicHypertension: z.boolean().optional(),
  otherMedicalCondition: z.boolean().optional(),
  otherMedicalConditionText: z.string().optional(),

  // Lab Tests
  vdrl: z.string().optional(),
  hiv: z.string().optional(),
  hbsAg: z.string().optional(),
  rbs: z.string().optional(),
  fbs: z.string().optional(),
  bloodGroupRh: z.string().optional(),
  ua: z.string().optional(),

  // Supplement
  td: z.string().optional(),

  // Initial Evaluation: General Exam
  generalExamGeneral: z.string().optional(),
  generalExamPallor: z.string().optional(),
  jaundice: z.boolean().optional(),
  chestAbnormality: z.boolean().optional(),
  heartAbnormality: z.boolean().optional(),

  // Initial Evaluation: Gyn Exam
  vulvarUlcer: z.boolean().optional(),
  vaginalDischarge: z.boolean().optional(),
  pelvicMass: z.boolean().optional(),
  cervicalLesion: z.boolean().optional(),
  uterineSizeWks: z.number().int().positive().optional(),

  // Counseling/Testing
  dangerSignsAdvised: z.boolean().optional(),
  birthPreparednessAdvised: z.boolean().optional(),
  motherHivTestAccepted: z.boolean().optional(),
  hivTestResult: z.string().optional(),

  // HIV + Care & Follow-up
  hivTestResultReceived: z.boolean().optional(),
  counseledInfantFeeding: z.boolean().optional(),
  referredForCare: z.boolean().optional(),
  partnerHivTestResult: z.string().optional(),

  // Present Pregnancy: Follow up
  gaLmp: z.string().optional(),
  complaints: z.string().optional(),
  bloodPressure: z.string().optional(),
  weightKg: z.number().positive().optional(),
  pallor: z.string().optional(),
  hemoglobin: z.string().optional(),
  uterineHeightWks: z.number().int().positive().optional(),
  presentation: z.string().optional(),
  descent: z.string().optional(),
  fetalHeartRate: z.string().optional(),
  remarks: z.string().optional(),
  nextFollowUpDate: z.coerce.date().optional(),
  dangerSignsIdentified: z.string().optional(),
  actionAdviceCounselling: z.string().optional(),
});
