"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// import { Role } from "../../generated/prisma/enums";
const auth_repository_1 = require("./auth.repository");
const crypto_1 = __importDefault(require("crypto"));
const audit_service_1 = require("../common/audit.service");
const config_1 = __importDefault(require("../config"));
const AppError_1 = require("../utils/AppError");
class AuthService {
    static signAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.accessSecret, {
            expiresIn: config_1.default.jwt.accessExpiresIn,
        });
    }
    static signRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.refreshSecret, {
            expiresIn: `${config_1.default.jwt.refreshExpiresDays}d`,
        });
    }
    static async register(input) {
        const { phone, password, fullName, ip } = input;
        const existingUser = await auth_repository_1.AuthRepository.findUserByPhone(phone);
        if (existingUser) {
            throw new AppError_1.AppError("User already exists", 400);
        }
        const passwordHash = await bcrypt_1.default.hash(password, config_1.default.bcryptRounds);
        const user = await auth_repository_1.AuthRepository.createUser({
            phone,
            passwordHash,
            fullName,
        });
        await (0, audit_service_1.log)(user.id, "auth.register", { phone }, ip ?? null);
        return user;
    }
    static async login(input) {
        // const user = await prisma.user.findUnique({ where: { username } });
        const { phone, password, ip } = input;
        const user = await auth_repository_1.AuthRepository.findUserByPhone(phone);
        if (!user)
            throw new AppError_1.AppError("Invalid credentials", 401);
        const ok = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!ok)
            throw new AppError_1.AppError("Invalid credentials", 401);
        if (user.mustChangePassword) {
            throw new AppError_1.AppError("You must change your password first", 401);
        }
        const roles = user.roles.map((r) => r.role.name);
        const accessToken = this.signAccessToken({ uid: user.id, roles });
        const refreshToken = this.signRefreshToken({ uid: user.id });
        const tokenHash = crypto_1.default
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");
        const expiresAt = new Date(Date.now() + config_1.default.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000);
        await auth_repository_1.AuthRepository.saveRefreshToken(user.id, tokenHash, expiresAt);
        await (0, audit_service_1.log)(user.id, "auth.login", {}, ip ?? null);
        return { user, accessToken, refreshToken };
    }
    static async changePassword(input) {
        const { userId, currentPassword, newPassword, ip } = input;
        const user = await auth_repository_1.AuthRepository.findUserById(userId);
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        // Verify current password
        const isCurrentPasswordValid = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new AppError_1.AppError("Current password is incorrect", 400);
        }
        // Hash new password
        const newPasswordHash = await bcrypt_1.default.hash(newPassword, config_1.default.bcryptRounds);
        // Update password and set mustChangePassword to false
        await auth_repository_1.AuthRepository.updateUser(userId, {
            passwordHash: newPasswordHash,
            mustChangePassword: false,
        });
        await (0, audit_service_1.log)(userId, "auth.changePassword", {}, ip ?? null);
        return { message: "Password changed successfully" };
    }
    static async firstTimeChangePassword(input) {
        const { phone, initialPassword, newPassword, ip } = input;
        const user = await auth_repository_1.AuthRepository.findUserByPhone(phone);
        if (!user)
            throw new AppError_1.AppError("Invalid credentials", 401);
        // Verify user must change password
        if (!user.mustChangePassword) {
            throw new AppError_1.AppError("Password has already been changed. Use the regular change password endpoint.", 400);
        }
        // Verify initial password
        const isInitialPasswordValid = await bcrypt_1.default.compare(initialPassword, user.passwordHash);
        if (!isInitialPasswordValid) {
            throw new AppError_1.AppError("Invalid initial password", 401);
        }
        // Hash new password
        const newPasswordHash = await bcrypt_1.default.hash(newPassword, config_1.default.bcryptRounds);
        // Update password and set mustChangePassword to false
        await auth_repository_1.AuthRepository.updateUser(user.id, {
            passwordHash: newPasswordHash,
            mustChangePassword: false,
        });
        await (0, audit_service_1.log)(user.id, "auth.firstTimeChangePassword", {}, ip ?? null);
        return { message: "Password changed successfully. You can now login." };
    }
    static async refresh(input) {
        const { refreshToken, ip } = input;
        const payload = jsonwebtoken_1.default.verify(refreshToken, config_1.default.jwt.refreshSecret);
        const tokenHash = crypto_1.default
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");
        const dbToken = await auth_repository_1.AuthRepository.findRefreshToken(tokenHash);
        if (!dbToken)
            throw new AppError_1.AppError("Invalid refresh token", 401);
        const user = await auth_repository_1.AuthRepository.findUserById(payload.uid);
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        const roles = user.roles.map((r) => r.role.name);
        const newAccess = this.signAccessToken({
            uid: user.id,
            roles,
        });
        const newRefresh = this.signRefreshToken({
            uid: user.id,
        });
        const newHash = crypto_1.default
            .createHash("sha256")
            .update(newRefresh)
            .digest("hex");
        const expiresAt = new Date(Date.now() + config_1.default.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000);
        await auth_repository_1.AuthRepository.saveRefreshToken(user.id, newHash, expiresAt);
        await auth_repository_1.AuthRepository.revokeRefreshToken(tokenHash);
        await (0, audit_service_1.log)(user.id, "auth.refresh", {}, ip ?? null);
        return { accessToken: newAccess, refreshToken: newRefresh };
    }
}
exports.AuthService = AuthService;
