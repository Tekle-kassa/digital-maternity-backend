import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  displayId: z.string().optional(),
  profileImageUrl: z.string().url().optional().or(z.literal("")),
  preferredLanguage: z.enum(["EN", "SO"]).optional(),
});
