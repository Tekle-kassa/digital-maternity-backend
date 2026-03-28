import { AppError } from "../utils/AppError";
import { dbRolesToApi } from "../v1/roles";
import { UserRepository } from "../user/user.repository";
import {
  ConversationRepository,
  MessageRepository,
} from "./messages.repository";

type UserLite = {
  id: string;
  fullName: string | null;
  phone: string;
  displayId: string | null;
  profileImageUrl: string | null;
};

function linePreview(body: string, max = 120): string {
  const line =
    body.split(/\r?\n/).find((l) => l.trim())?.trim() ?? "";
  if (line.length <= max) return line;
  return `${line.slice(0, max - 1)}…`;
}

function userSummary(u: UserLite) {
  return {
    id: u.id,
    fullName: u.fullName,
    phone: u.phone,
    displayId: u.displayId ?? undefined,
    profileImageUrl: u.profileImageUrl ?? undefined,
  };
}

export class MessagesService {
  /** List conversations for current user with last message and unread count. */
  static async listConversations(
    userId: string,
    opts: { folder?: "inbox" | "outbox"; search?: string } = {}
  ) {
    const conversations = await ConversationRepository.findForUser(userId);
    const result = await Promise.all(
      conversations.map(async (c) => {
        const other =
          c.user1Id === userId ? c.user2 : c.user1;
        const last = await MessageRepository.getLastMessage(c.id);
        const unread = await MessageRepository.getUnreadCount(c.id, userId);
        const lastSentByMe = last?.senderId === userId;
        return {
          id: c.id,
          otherUser: {
            id: other.id,
            fullName: other.fullName,
            phone: other.phone,
          },
          lastMessage: last
            ? {
                body: last.body,
                senderId: last.senderId,
                createdAt: last.createdAt,
              }
            : null,
          unreadCount: unread,
          updatedAt: c.updatedAt,
          _folder: lastSentByMe ? "outbox" : "inbox",
        };
      })
    );
    let filtered = result;
    if (opts.folder) {
      filtered = result.filter((r) => r._folder === opts.folder);
    }
    if (opts.search) {
      const q = opts.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.otherUser.fullName?.toLowerCase().includes(q) ||
          r.otherUser.phone?.toLowerCase().includes(q)
      );
    }
    return filtered.map(({ _folder, ...rest }) => rest);
  }

  /** Get or create a conversation between current user and other user. */
  static async getOrCreateConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new AppError("Cannot start conversation with yourself", 400);
    }
    const conversation = await ConversationRepository.findOrCreate(
      userId,
      otherUserId
    );
    const other =
      conversation.user1Id === userId ? conversation.user2 : conversation.user1;
    const unread = await MessageRepository.getUnreadCount(
      conversation.id,
      userId
    );
    return {
      id: conversation.id,
      otherUser: {
        id: other.id,
        fullName: other.fullName,
        phone: other.phone,
      },
      unreadCount: unread,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  /** Get one conversation by id (must be participant). */
  static async getConversation(conversationId: string, userId: string) {
    const conv = await ConversationRepository.findById(conversationId);
    if (!conv) throw new AppError("Conversation not found", 404);
    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      throw new AppError("Forbidden", 403);
    }
    const other = conv.user1Id === userId ? conv.user2 : conv.user1;
    const unread = await MessageRepository.getUnreadCount(conv.id, userId);
    return {
      id: conv.id,
      otherUser: {
        id: other.id,
        fullName: other.fullName,
        phone: other.phone,
      },
      unreadCount: unread,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  /** Get messages in a conversation (paginated). */
  static async getMessages(
    conversationId: string,
    userId: string,
    limit: number,
    offset: number
  ) {
    const conv = await ConversationRepository.findById(conversationId);
    if (!conv) throw new AppError("Conversation not found", 404);
    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      throw new AppError("Forbidden", 403);
    }
    const messages = await MessageRepository.findByConversation(
      conversationId,
      { limit, offset }
    );
    return messages.reverse(); // chronological for display
  }

  /** Send a message in a conversation. */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    body: string,
    attachmentUrl?: string
  ) {
    const conv = await ConversationRepository.findById(conversationId);
    if (!conv) throw new AppError("Conversation not found", 404);
    if (conv.user1Id !== senderId && conv.user2Id !== senderId) {
      throw new AppError("Forbidden", 403);
    }
    const recipientId =
      conv.user1Id === senderId ? conv.user2Id : conv.user1Id;
    const message = await MessageRepository.create({
      conversationId,
      senderId,
      recipientId,
      body,
      attachmentUrl: attachmentUrl || undefined,
    });
    await ConversationRepository.updateTimestamp(conversationId);
    return message;
  }

  /** Mark a message as read (only recipient). */
  static async markAsRead(messageId: string, userId: string) {
    const msg = await MessageRepository.findById(messageId);
    if (!msg) throw new AppError("Message not found", 404);
    if (msg.recipientId !== userId) {
      throw new AppError("Forbidden", 403);
    }
    await MessageRepository.markAsRead(messageId, userId);
    return { ok: true };
  }

  /** Mark all messages in a conversation as read (for current user as recipient). */
  static async markConversationAsRead(conversationId: string, userId: string) {
    const conv = await ConversationRepository.findById(conversationId);
    if (!conv) throw new AppError("Conversation not found", 404);
    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      throw new AppError("Forbidden", 403);
    }
    await MessageRepository.markConversationAsRead(conversationId, userId);
    return { ok: true };
  }

  /**
   * Email-style mailbox: flat list of messages for inbox (received) or outbox (sent),
   * newest first by createdAt.
   */
  static async listMailbox(
    userId: string,
    folder: "inbox" | "outbox",
    opts: { search?: string; limit: number; offset: number }
  ) {
    const { search, limit, offset } = opts;
    const [rows, total] = await Promise.all([
      MessageRepository.findMailbox(userId, folder, {
        search,
        limit,
        offset,
      }),
      MessageRepository.countMailbox(userId, folder, search),
    ]);
    const messages = rows.map((m) => {
      const counterpart: UserLite =
        folder === "inbox" ? m.sender : m.recipient;
      return {
        id: m.id,
        conversationId: m.conversationId,
        createdAt: m.createdAt,
        preview: linePreview(m.body),
        isUnread: folder === "inbox" ? m.readAt === null : false,
        senderId: m.senderId,
        recipientId: m.recipientId,
        counterpart: userSummary(counterpart),
        attachmentUrl: m.attachmentUrl ?? undefined,
      };
    });
    return { messages, total, limit, offset };
  }

  /** One message by id if current user is sender or recipient (detail view). */
  static async getMailboxMessage(messageId: string, userId: string) {
    const msg = await MessageRepository.findById(messageId);
    if (!msg) throw new AppError("Message not found", 404);
    if (msg.senderId !== userId && msg.recipientId !== userId) {
      throw new AppError("Forbidden", 403);
    }
    const isInbox = msg.recipientId === userId;
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      body: msg.body,
      createdAt: msg.createdAt,
      readAt: msg.readAt,
      isUnread: isInbox ? msg.readAt === null : false,
      attachmentUrl: msg.attachmentUrl ?? undefined,
      sender: userSummary(msg.sender),
      recipient: userSummary(msg.recipient),
    };
  }

  /** Compose without conversation id: resolves thread internally. */
  static async composeMailbox(
    senderId: string,
    recipientId: string,
    body: string,
    attachmentUrl?: string
  ) {
    const conv = await MessagesService.getOrCreateConversation(
      senderId,
      recipientId
    );
    return MessagesService.sendMessage(
      conv.id,
      senderId,
      body,
      attachmentUrl
    );
  }

  /** Active staff (admins + clinical roles) for recipient picker; excludes current user. */
  static async listStaffDirectory(
    currentUserId: string,
    opts: { search?: string; limit: number; offset: number }
  ) {
    const { search, limit, offset } = opts;
    const [rows, total] = await Promise.all([
      UserRepository.findStaffDirectory(currentUserId, {
        search,
        limit,
        offset,
      }),
      UserRepository.countStaffDirectory(currentUserId, search),
    ]);
    const users = rows.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      displayId: u.displayId ?? undefined,
      profileImageUrl: u.profileImageUrl ?? undefined,
      role: dbRolesToApi(u.roles),
    }));
    return { users, total, limit, offset };
  }
}
