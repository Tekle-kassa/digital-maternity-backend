import { z } from "zod";

export const createConversationSchema = z.object({
  otherUserId: z.string().min(1, "Other user ID is required"),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1, "Message body is required"),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
});

export const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const listConversationsQuerySchema = z.object({
  folder: z.enum(["inbox", "outbox"]).optional(), // inbox = last message received by me; outbox = last message sent by me
  search: z.string().optional(),
});
