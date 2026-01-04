import { User } from "../generated/prisma/client";
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

  static async createPasswordResetOTP(
    userId: string,
    code: string,
    expiresAt: Date
  ) {
    // Invalidate any existing unused OTPs for this user
    await prisma.passwordResetOTP.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });

    return prisma.passwordResetOTP.create({
      data: { userId, code, expiresAt },
    });
  }

  static async findValidPasswordResetOTP(userId: string, code: string) {
    return prisma.passwordResetOTP.findFirst({
      where: {
        userId,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  static async markOTPAsUsed(otpId: string) {
    return prisma.passwordResetOTP.update({
      where: { id: otpId },
      data: { used: true },
    });
  }

  static async cleanupExpiredOTPs() {
    return prisma.passwordResetOTP.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { used: true }],
      },
    });
  }
}
