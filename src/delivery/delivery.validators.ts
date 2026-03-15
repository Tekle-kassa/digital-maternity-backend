import { z } from "zod";

const newbornSchema = z.object({
  quantity: z.enum(["Single", "Multiple"]).optional(),
  sex: z.enum(["Male", "Female"]).optional(),
  termStatus: z.enum(["Term", "Preterm"]).optional(),
  alive: z.boolean().optional(),
  apgarScore: z.number().int().min(0).max(10).optional(),
  sb: z.enum(["Mac", "Fresh"]).optional(),
  birthWeightGm: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  vitK: z.boolean().optional(),
  ttc: z.boolean().optional(),
  babyMotherBonding: z.boolean().optional(),
});

export const deliverySchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  pregnancyId: z.string().optional(),
  recordedById: z.string().min(1).optional(), // Set from auth if omitted

  // Consent (Delivery Summary Recording - Screen 1)
  clientConsentSignature: z.string().optional(),
  healthProfessionalConsentSignature: z.string().optional(),

  // Delivery Details (Screen 2)
  deliveryDate: z.coerce.date().optional(),
  deliveryTime: z.string().optional(),
  referral: z.boolean().optional(),
  referralInfo: z.string().optional(),

  // AMTSL (UI: Ergometrine, Oxytocin, Misoprostol)
  amtsl: z.enum(["Ergometrine", "Oxytocin", "Misoprostol"]).optional(),

  // Placenta (UI: Completed, Incomplete, CCT, NRP)
  placenta: z.enum(["Completed", "Incomplete", "CCT", "MRP", "NRP"]).optional(),

  // Laceration
  laceration: z.enum(["1st Degree", "2nd Degree", "3rd Degree"]).optional(),

  // Management (Screen 3)
  obstetricCxManaged: z.boolean().optional(),
  aphManaged: z.boolean().optional(),
  rupturedUx: z.boolean().optional(),
  eclampsiaManaged: z.boolean().optional(),
  pphManaged: z.boolean().optional(),
  promSepsisManaged: z.boolean().optional(),
  obstPrologLaborManaged: z.boolean().optional(),

  // Delivery Assistance (Screen 4)
  deliveryAssistanceMeasures: z.string().optional(),
  deliveryAssistanceMore: z.string().optional(),

  // HIV Details
  hivCounsTestingOffered: z.string().optional(),
  hivTestingAccepted: z.string().optional(),
  hivTestResult: z.string().optional(),
  arvpxForMothers: z.string().optional(),
  arvpxForNb: z.string().optional(),
  feedingOptionEbf: z.string().optional(),
  rf: z.string().optional(),

  // Newborns (Screens 5 & 6)
  newborns: z.array(newbornSchema).optional(),
});
