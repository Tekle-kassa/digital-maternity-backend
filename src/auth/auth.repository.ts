import { User } from "../generated/prisma/client";
import { Prisma } from "../generated/prisma/client";
import prisma from "../config/prisma";

const rolesInclude = {
  roles: {
    include: {
      role: true,
    },
  },
} as const;

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
      include: rolesInclude,
    });
  }

  /**
   * Email lookup: uses raw SQL so login-by-email works even when the checked-in
   * Prisma client is stale (run `npx prisma generate` after fixing permissions on
   * `src/generated/prisma` so `findUnique({ where: { email } })` and `include: { clinic }` work).
   */
  static async findUserByEmail(email: string) {
    const norm = email.trim().toLowerCase();
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT id FROM "User" WHERE LOWER(email) = ${norm} LIMIT 1`
    );
    const row = rows[0];
    if (!row) return null;
    return prisma.user.findUnique({
      where: { id: row.id },
      include: rolesInclude,
    });
  }

  static async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: rolesInclude,
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
