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
  recordedById: z.string().min(1, "Recorded by ID is required"),

  // Delivery Details
  deliveryDate: z.coerce.date().optional(),
  deliveryTime: z.string().optional(),

  // AMTSL (Active Management of Third Stage of Labor)
  amtsl: z.enum(["Ergomtrine", "Oxytocine", "Misoprostol"]).optional(),

  // Placenta
  placenta: z.enum(["Completed", "Incomplete", "CCT", "MRP"]).optional(),

  // Laceration
  laceration: z.enum(["1st Degree", "2nd Degree", "3rd Degree"]).optional(),

  // Management
  obstetricCxManaged: z.boolean().optional(),
  aphManaged: z.boolean().optional(),
  rupturedUx: z.boolean().optional(),
  eclampsiaManaged: z.boolean().optional(),
  pphManaged: z.boolean().optional(),
  promSepsisManaged: z.boolean().optional(),
  obstPrologLaborManaged: z.boolean().optional(),

  // HIV Details
  hivCounsTestingOffered: z.string().optional(),
  hivTestingAccepted: z.string().optional(),
  hivTestResult: z.string().optional(),
  arvpxForMothers: z.string().optional(),
  arvpxForNb: z.string().optional(),
  feedingOptionEbf: z.string().optional(),
  rf: z.string().optional(),

  // Newborns
  newborns: z.array(newbornSchema).optional(),
});
