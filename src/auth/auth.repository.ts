import { User } from "../../generated/prisma/client";
import prisma from "../config/prisma";

export class AuthRepository {
  static async createUser(data: {
    phone: string;
    passwordHash: string;
    fullName: string;
  }) {
    return prisma.user.create({
      data,
    });
  }
  static async findUserByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }
  static async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }
  static async saveRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  static async revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  static async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false },
    });
  }
  static async updateUser(userId: string, data: Partial<User>) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
