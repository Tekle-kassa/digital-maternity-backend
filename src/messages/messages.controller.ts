import { Request, Response, NextFunction } from "express";
import { MessagesService } from "./messages.service";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  createConversationSchema,
  sendMessageSchema,
  listMessagesQuerySchema,
  listConversationsQuerySchema,
  mailboxListQuerySchema,
  composeMailboxSchema,
  staffDirectoryQuerySchema,
} from "./messages.validators";

export class MessagesController {
  /** GET /directory – staff list for choosing message recipients. */
  static async listStaffDirectory(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as AuthRequest).user!.id;
      const query = staffDirectoryQuerySchema.parse(req.query);
      const result = await MessagesService.listStaffDirectory(userId, {
        search: query.search,
        limit: query.limit,
        offset: query.offset,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /** GET /mailbox – flat inbox/outbox by message time (newest first). */
  static async listMailbox(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as AuthRequest).user!.id;
      const query = mailboxListQuerySchema.parse(req.query);
      const result = await MessagesService.listMailbox(userId, query.folder, {
        search: query.search,
        limit: query.limit,
        offset: query.offset,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /** GET /mailbox/:id – single message (participant only). */
  static async getMailboxMessage(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as AuthRequest).user!.id;
      const detail = await MessagesService.getMailboxMessage(
        req.params.id,
        userId
      );
      res.json({ success: true, message: detail });
    } catch (err) {
      next(err);
    }
  }

  /** POST /mailbox – compose to recipient (no conversation id). */
  static async composeMailbox(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as AuthRequest).user!.id;
      const parsed = composeMailboxSchema.parse(req.body);
      const attachmentUrl =
        (req as any).file?.location || (req.body as any).attachmentUrl;
      const message = await MessagesService.composeMailbox(
        userId,
        parsed.recipientId,
        parsed.body,
        attachmentUrl || undefined
      );
      res.status(201).json({ success: true, message });
    } catch (err) {
      next(err);
    }
  }

  /** GET /conversations – list my conversations (inbox/outbox, search). */
  static async listConversations(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as AuthRequest).user!.id;
      const query = listConversationsQuerySchema.parse(req.query);
      const list = await MessagesService.listConversations(userId, {
        folder: query.folder,
        search: query.search,
      });
      res.json({ success: true, conversations: list });
    } catch (err) {
      next(err);
    }
  }

  /** POST /conversations – get or create conversation with other user. */
  static async getOrCreateConversation(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as AuthRequest).user!.id;
      const parsed = createConversationSchema.parse(req.body);
      const conversation = await MessagesService.getOrCreateConversation(
        userId,
        parsed.otherUserId
      );
      res.status(200).json({ success: true, conversation });
    } catch (err) {
      next(err);
    }
  }

  /** GET /conversations/:id – get one conversation. */
  static async getConversation(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as AuthRequest).user!.id;
      const conversation = await MessagesService.getConversation(
        req.params.id,
        userId
      );
      res.json({ success: true, conversation });
    } catch (err) {
      next(err);
    }
  }

  /** GET /conversations/:id/messages – list messages (paginated). */
  static async listMessages(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as AuthRequest).user!.id;
      const query = listMessagesQuerySchema.parse(req.query);
      const messages = await MessagesService.getMessages(
        req.params.id,
        userId,
        query.limit,
        query.offset
      );
      res.json({ success: true, messages });
    } catch (err) {
      next(err);
    }
  }

  /** POST /conversations/:id/messages – send a message. */
  static async sendMessage(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as AuthRequest).user!.id;
      const parsed = sendMessageSchema.parse(req.body);
      const attachmentUrl =
        (req as any).file?.location || (req.body as any).attachmentUrl;
      const message = await MessagesService.sendMessage(
        req.params.id,
        userId,
        parsed.body,
        attachmentUrl
      );
      res.status(201).json({ success: true, message });
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /messages/:id/read – mark message as read. */
  static async markAsRead(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as AuthRequest).user!.id;
      await MessagesService.markAsRead(req.params.id, userId);
      res.json({ success: true, ok: true });
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /conversations/:id/read – mark all messages in conversation as read. */
  static async markConversationAsRead(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as AuthRequest).user!.id;
      await MessagesService.markConversationAsRead(req.params.id, userId);
      res.json({ success: true, ok: true });
    } catch (err) {
      next(err);
    }
  }
}
