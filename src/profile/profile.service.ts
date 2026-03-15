import { AppError } from "../utils/AppError";
import { AuthRepository } from "../auth/auth.repository";
import prisma from "../config/prisma";

export class ProfileService {
  /** Get current user profile (safe fields for Profile screen). */
  static async getProfile(userId: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);
    const roles = user.roles.map((r) => r.role.name);
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      displayId: user.displayId ?? user.id.slice(0, 8).toUpperCase(),
      profileImageUrl: user.profileImageUrl ?? null,
      preferredLanguage: user.preferredLanguage ?? null,
      roles,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
    };
  }

  /** Update current user profile. */
  static async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      displayId?: string;
      profileImageUrl?: string;
      preferredLanguage?: string;
    }
  ) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);
    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.displayId !== undefined) updateData.displayId = data.displayId;
    if (data.profileImageUrl !== undefined)
      updateData.profileImageUrl =
        data.profileImageUrl === "" ? null : data.profileImageUrl;
    if (data.preferredLanguage !== undefined)
      updateData.preferredLanguage = data.preferredLanguage;
    await AuthRepository.updateUser(userId, updateData as any);
    return this.getProfile(userId);
  }

  /** Get last sync status for current user (Synchronization in Profile). */
  static async getSyncStatus(userId: string) {
    const last = await prisma.syncLog.findFirst({
      where: { userId },
      orderBy: { syncTimestamp: "desc" },
    });
    return last
      ? {
          lastSyncAt: last.syncTimestamp,
          recordsPushed: last.recordsPushed,
          recordsPulled: last.recordsPulled,
          status: last.status,
        }
      : null;
  }
}
