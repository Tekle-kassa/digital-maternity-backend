import { z } from "zod";

/** UI: Supplement screen — TD1 … TD5 */
export const ancTdSchema = z.enum(["TD1", "TD2", "TD3", "TD4", "TD5"]);

/** UI: HIV test result — Reactive / Non-reactive / Indeterminate */
export const ancHivResultSchema = z.enum(["R", "NR", "I"]);

// Past obstetric history entry (UI: Year, GA, Mode of Delivery, Sex, Birth Weight kg)
export const pastObstetricEntrySchema = z.object({
  year: z.string().optional(),
  ga: z.string().optional(),
  modeOfDelivery: z.string().optional(),
  sex: z.string().optional(),
  birthWeightKg: z.union([z.number(), z.string()]).optional(),
});

/**
 * ANC Medical Recording (Register Client) — clinical steps only.
 * Call after `POST /patient/anc/basic-information`; send `patientId` from that response.
 * All sections optional except patientId; map each UI screen to the grouped fields below.
 */
export const ancRecordSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),

  // Consent (first ANC screens if collected with clinical bundle)
  clientConsentSignature: z.string().optional(),
  healthProfessionalConsentSignature: z.string().optional(),

  // Screen: Basic Information (cont'd) — LMP, EDD, obstetric counts
  lmp: z.coerce.date().optional(),
  edd: z.coerce.date().optional(),
  gravida: z.coerce.number().int().nonnegative().optional(),
  para: z.coerce.number().int().nonnegative().optional(),
  abortion: z.coerce.number().int().nonnegative().optional(),
  ectopicPreg: z.coerce.number().int().nonnegative().optional(),
  childrenAlive: z.coerce.number().int().nonnegative().optional(),

  // Screen: Past Obstetric History
  pastObstetricHistory: z.array(pastObstetricEntrySchema).optional(),

  // Screen: General Medical History (Yes/No + optional more info)
  diabetesMellitus: z.boolean().optional(),
  diabetesMellitusMoreInfo: z.string().optional(),
  cardiacDisease: z.boolean().optional(),
  cardiacDiseaseMoreInfo: z.string().optional(),
  chronicHypertension: z.boolean().optional(),
  chronicHypertensionMoreInfo: z.string().optional(),
  otherMedicalCondition: z.boolean().optional(),
  otherMedicalConditionText: z.string().optional(),

  // Screen: Lab Tests
  vdrl: z.string().optional(),
  hiv: z.string().optional(),
  hbsAg: z.string().optional(),
  rbs: z.string().optional(),
  fbs: z.string().optional(),
  bloodGroupRh: z.string().optional(),
  ua: z.string().optional(),

  // Screen: Supplement (TD1–TD5); union allows legacy free-text from register-client
  td: z.union([ancTdSchema, z.string()]).optional(),

  // Screen: Initial Evaluation — General Exam
  generalExamGeneral: z.string().optional(),
  generalExamPallor: z.string().optional(),
  jaundice: z.boolean().optional(),
  chestAbnormality: z.boolean().optional(),
  chestAbnormalityMoreInfo: z.string().optional(),
  heartAbnormality: z.boolean().optional(),
  heartAbnormalityMoreInfo: z.string().optional(),

  // Screen: Initial Evaluation — Gyn Exam
  vulvarUlcer: z.boolean().optional(),
  vaginalDischarge: z.boolean().optional(),
  pelvicMass: z.boolean().optional(),
  cervicalLesion: z.boolean().optional(),
  uterineSizeWks: z.coerce.number().int().positive().optional(),

  // Screen: Counseling / Testing
  dangerSignsAdvised: z.boolean().optional(),
  birthPreparednessAdvised: z.boolean().optional(),
  motherHivTestAccepted: z.boolean().optional(),
  hivTestResult: z.union([ancHivResultSchema, z.string()]).optional(),

  // Screen: HIV + Care & Follow-up
  hivTestResultReceived: z.boolean().optional(),
  counseledInfantFeeding: z.boolean().optional(),
  referredForCare: z.boolean().optional(),
  partnerHivTestResult: z.union([ancHivResultSchema, z.string()]).optional(),

  // Screens: Present Pregnancy — Follow-up (parts 1–3)
  gaLmp: z.string().optional(),
  complaints: z.string().optional(),
  bloodPressure: z.string().optional(),
  weightKg: z.coerce.number().positive().optional(),
  pallor: z.string().optional(),
  hemoglobin: z.string().optional(),
  uterineHeightWks: z.coerce.number().int().positive().optional(),
  presentation: z.string().optional(),
  descent: z.string().optional(),
  fetalHeartRate: z.string().optional(),
  remarks: z.string().optional(),
  nextFollowUpDate: z.coerce.date().optional(),
  dangerSignsIdentified: z.string().optional(),
  actionAdviceCounselling: z.string().optional(),
});
