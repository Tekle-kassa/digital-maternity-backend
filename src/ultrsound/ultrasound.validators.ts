import { z } from "zod";
import { AppError } from "../utils/AppError";

/** Legacy JSON body for UltrasoundController (v1 router uses multipart + parseUltrasoundMultipartFields). */
export const ultrasoundSchema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  description: z.string().optional(),
  gestationalAge: z.coerce.number().optional(),
});

export const ultrasoundMultipartFieldsSchema = z
  .object({
    timestamp: z.string().min(1, "timestamp is required"),
    visitId: z.string().uuid("visitId must be a valid UUID"),
    gain: z.string().optional(),
    depth: z.string().optional(),
    dynamicRange: z.string().optional(),
  })
  .refine((d) => !Number.isNaN(Date.parse(d.timestamp)), {
    path: ["timestamp"],
    message:
      "timestamp must be valid ISO 8601 UTC (e.g. 2026-03-29T08:15:30.123Z)",
  });

export type ParsedUltrasoundMultipartFields = {
  capturedAt: Date;
  visitId: string;
  gain?: number;
  depth?: number;
  dynamicRange?: number;
};

function parseOptInt(
  value: string | undefined,
  field: string
): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) {
    throw new AppError(`${field} must be an integer string`, 400);
  }
  return n;
}

export function parseUltrasoundMultipartFields(
  body: Record<string, unknown>
): ParsedUltrasoundMultipartFields {
  const parsed = ultrasoundMultipartFieldsSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    throw new AppError(msg, 400);
  }
  const o = parsed.data;
  return {
    capturedAt: new Date(o.timestamp),
    visitId: o.visitId,
    gain: parseOptInt(o.gain, "gain"),
    depth: parseOptInt(o.depth, "depth"),
    dynamicRange: parseOptInt(o.dynamicRange, "dynamicRange"),
  };
}
