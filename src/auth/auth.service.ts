import prisma from "../config/prisma";

import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
// import { Role } from "../../generated/prisma/enums";
import { AuthRepository } from "./auth.repository";
import crypto from "crypto";
import { log } from "../common/audit.service";
import config from "../config";
import { AppError } from "../utils/AppError";

export class AuthService {
  static signAccessToken(payload: object) {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    } as SignOptions);
  }

  static signRefreshToken(payload: object) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: `${config.jwt.refreshExpiresDays}d`,
    });
  }
  static async register(input: {
    phone: string;
    password: string;
    fullName: string;
    ip?: string;
  }) {
    const { phone, password, fullName, ip } = input;
    const existingUser = await AuthRepository.findUserByPhone(phone);
    if (existingUser) {
      throw new AppError("User already exists", 400);
    }
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const user = await AuthRepository.createUser({
      phone,
      passwordHash,
      fullName,
    });
    await log(user.id, "auth.register", { phone }, ip ?? null);
    return user;
  }
  static async login(input: { phone: string; password: string; ip?: string }) {
    // const user = await prisma.user.findUnique({ where: { username } });
    const { phone, password, ip } = input;
    const user = await AuthRepository.findUserByPhone(phone);

    if (!user) throw new AppError("Invalid credentials", 401);
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError("Invalid credentials", 401);
    if (user.mustChangePassword) {
      throw new AppError("You must change your password first", 401);
    }
    const roles = user.roles.map((r) => r.role.name);
    const accessToken = this.signAccessToken({ uid: user.id, roles });
    const refreshToken = this.signRefreshToken({ uid: user.id });
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const expiresAt = new Date(
      Date.now() + config.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000
    );
    await AuthRepository.saveRefreshToken(user.id, tokenHash, expiresAt);
    await log(user.id, "auth.login", {}, ip ?? null);
    return { user, accessToken, refreshToken };
  }
  static async changePassword(input: {
    userId: string;
    currentPassword: string;
    newPassword: string;
    ip?: string;
  }) {
    const { userId, currentPassword, newPassword, ip } = input;

    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      throw new AppError("Current password is incorrect", 400);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

    // Update password and set mustChangePassword to false
    await AuthRepository.updateUser(userId, {
      passwordHash: newPasswordHash,
      mustChangePassword: false,
    });

    await log(userId, "auth.changePassword", {}, ip ?? null);
    return { message: "Password changed successfully" };
  }
  static async firstTimeChangePassword(input: {
    phone: string;
    initialPassword: string;
    newPassword: string;
    ip?: string;
  }) {
    const { phone, initialPassword, newPassword, ip } = input;

    const user = await AuthRepository.findUserByPhone(phone);
    if (!user) throw new AppError("Invalid credentials", 401);

    // Verify user must change password
    if (!user.mustChangePassword) {
      throw new AppError(
        "Password has already been changed. Use the regular change password endpoint.",
        400
      );
    }

    // Verify initial password
    const isInitialPasswordValid = await bcrypt.compare(
      initialPassword,
      user.passwordHash
    );
    if (!isInitialPasswordValid) {
      throw new AppError("Invalid initial password", 401);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

    // Update password and set mustChangePassword to false
    await AuthRepository.updateUser(user.id, {
      passwordHash: newPasswordHash,
      mustChangePassword: false,
    });

    await log(user.id, "auth.firstTimeChangePassword", {}, ip ?? null);
    return { message: "Password changed successfully. You can now login." };
  }
  static async refresh(input: { refreshToken: string; ip?: string }) {
    const { refreshToken, ip } = input;

    const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const dbToken = await AuthRepository.findRefreshToken(tokenHash);
    if (!dbToken) throw new AppError("Invalid refresh token", 401);

    const user = await AuthRepository.findUserById(payload.uid);
    if (!user) throw new AppError("User not found", 404);

    const roles = user.roles.map((r) => r.role.name);

    const newAccess = this.signAccessToken({
      uid: user.id,
      roles,
    });

    const newRefresh = this.signRefreshToken({
      uid: user.id,
    });

    const newHash = crypto
      .createHash("sha256")
      .update(newRefresh)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + config.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000
    );

    await AuthRepository.saveRefreshToken(user.id, newHash, expiresAt);
    await AuthRepository.revokeRefreshToken(tokenHash);

    await log(user.id, "auth.refresh", {}, ip ?? null);

    return { accessToken: newAccess, refreshToken: newRefresh };
  }
}
