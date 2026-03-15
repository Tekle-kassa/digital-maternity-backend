import prisma from "../config/prisma";

function canonicalUsers(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export class ConversationRepository {
  static async findOrCreate(user1Id: string, user2Id: string) {
    const [u1, u2] = canonicalUsers(user1Id, user2Id);
    let conv = await prisma.conversation.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
      include: { user1: true, user2: true, messages: { take: 1, orderBy: { createdAt: "desc" } } },
    });
    if (!conv) {
      conv = await prisma.conversation.create({
        data: { user1Id: u1, user2Id: u2 },
        include: { user1: true, user2: true, messages: true },
      });
    }
    return conv;
  }

  static async findById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: { user1: true, user2: true },
    });
  }

  static async findForUser(userId: string) {
    return prisma.conversation.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      include: { user1: true, user2: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  static async updateTimestamp(conversationId: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }
}

export class MessageRepository {
  static async create(data: {
    conversationId: string;
    senderId: string;
    recipientId: string;
    body: string;
    attachmentUrl?: string;
  }) {
    return prisma.message.create({
      data,
      include: { sender: true, recipient: true },
    });
  }

  static async findByConversation(
    conversationId: string,
    opts: { limit?: number; offset?: number } = {}
  ) {
    const { limit = 50, offset = 0 } = opts;
    return prisma.message.findMany({
      where: { conversationId },
      include: { sender: true, recipient: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  static async getLastMessage(conversationId: string) {
    return prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      include: { sender: true },
    });
  }

  static async getUnreadCount(conversationId: string, recipientId: string) {
    return prisma.message.count({
      where: {
        conversationId,
        recipientId,
        readAt: null,
      },
    });
  }

  static async markAsRead(messageId: string, recipientId: string) {
    return prisma.message.updateMany({
      where: { id: messageId, recipientId },
      data: { readAt: new Date() },
    });
  }

  static async markConversationAsRead(conversationId: string, recipientId: string) {
    return prisma.message.updateMany({
      where: { conversationId, recipientId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  static async findById(id: string) {
    return prisma.message.findUnique({
      where: { id },
      include: { sender: true, recipient: true, conversation: true },
    });
  }
}
