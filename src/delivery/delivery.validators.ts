import { z } from "zod";

const amtslDrug = z.enum(["Ergometrine", "Oxytocin", "Misoprostol"]);

const newbornSchema = z.object({
  // Screen 5–6: Newborn details
  quantity: z.enum(["Single", "Multiple"]).optional(),
  sex: z.enum(["Male", "Female"]).optional(),
  termStatus: z.enum(["Term", "Preterm"]).optional(),
  alive: z.boolean().optional(),
  apgarScore: z.coerce.number().int().min(0).max(10).optional(),
  sb: z.enum(["Mac", "Fresh"]).optional(), // Stillbirth
  birthWeightGm: z.coerce.number().positive().optional(),
  lengthCm: z.coerce.number().positive().optional(),
  /** UI: Vit K (sometimes mislabeled “NUK” on mockups) */
  vitK: z.boolean().optional(),
  ttc: z.boolean().optional(),
  babyMotherBonding: z.boolean().optional(),
});

/** Shared delivery fields (UI ↔ API). */
const deliveryFields = {
  patientId: z.string().min(1, "Patient ID is required"),
  pregnancyId: z.string().optional(),
  recordedById: z.string().min(1).optional(),

  // Screen 1 – Consent
  clientConsentSignature: z.string().optional(),
  healthProfessionalConsentSignature: z.string().optional(),

  // Screen 2 – Delivery details
  deliveryDate: z.coerce.date().optional(),
  deliveryTime: z.string().optional(),
  referral: z.boolean().optional(),
  referralInfo: z.string().optional(),

  /**
   * Screen 2 – AMTSL: one drug, or several if the UI allows multiple selections.
   * Stored as a single string in DB (comma-separated when multiple).
   */
  amtsl: z
    .union([amtslDrug, z.array(amtslDrug).min(1)])
    .optional(),

  /** Screen 2 – Placenta: Completed, Incomplete, CCT, MRP (UI); NRP kept for legacy data */
  placenta: z
    .enum(["Completed", "Incomplete", "CCT", "MRP", "NRP"])
    .optional(),

  laceration: z
    .enum(["1st Degree", "2nd Degree", "3rd Degree"])
    .optional(),

  // Screen 3 – Management / complications (booleans)
  obstetricCxManaged: z.boolean().optional(),
  aphManaged: z.boolean().optional(),
  rupturedUx: z.boolean().optional(),
  eclampsiaManaged: z.boolean().optional(),
  pphManaged: z.boolean().optional(),
  promSepsisManaged: z.boolean().optional(),
  obstPrologLaborManaged: z.boolean().optional(),

  // Screen 4 – Delivery assistance
  deliveryAssistanceMeasures: z.string().optional(),
  deliveryAssistanceMore: z.string().optional(),

  /**
   * Screen 7 – HIV & post-delivery care.
   * Prefer Yes/No; free text still accepted for older clients.
   */
  hivCounsTestingOffered: z
    .union([z.enum(["Yes", "No"]), z.string()])
    .optional(),
  hivTestingAccepted: z.union([z.enum(["Yes", "No"]), z.string()]).optional(),
  hivTestResult: z.union([z.enum(["Yes", "No", "R", "NR", "I"]), z.string()]).optional(),
  arvpxForMothers: z.string().optional(),
  arvpxForNb: z.string().optional(),
  feedingOptionEbf: z.string().optional(),
  /** Replacement feeding / related option (UI may label “BC”) */
  rf: z.string().optional(),
  /** UI label “BC” – maps to `rf` if `rf` is omitted */
  bc: z.string().optional(),

  newborns: z.array(newbornSchema).optional(),
};

function normalizeDeliveryPayload<T extends Record<string, unknown>>(p: T): Omit<T, "bc"> & {
  amtsl?: string;
  rf?: string;
} {
  const { bc, amtsl, ...rest } = p as T & {
    bc?: string;
    amtsl?: string | string[];
  };
  const out = { ...rest } as Record<string, unknown>;
  if (amtsl !== undefined) {
    out.amtsl = Array.isArray(amtsl) ? amtsl.join(", ") : amtsl;
  }
  if (bc !== undefined && out.rf === undefined) {
    out.rf = bc;
  }
  return out as Omit<T, "bc"> & { amtsl?: string; rf?: string };
}

/**
 * Delivery Summary Recording – full UI flow (screens 1–7).
 * `recordedById` is set from auth when omitted.
 */
export const deliverySchema = z
  .object(deliveryFields)
  .transform(normalizeDeliveryPayload);

export const deliveryUpdateSchema = z
  .object(deliveryFields)
  .partial()
  .transform(normalizeDeliveryPayload);
