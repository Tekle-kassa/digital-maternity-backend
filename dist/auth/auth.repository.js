"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class AuthRepository {
    static async createUser(data) {
        return prisma_1.default.user.create({
            data,
        });
    }
    static async findUserByPhone(phone) {
        return prisma_1.default.user.findUnique({
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
    static async findUserById(id) {
        return prisma_1.default.user.findUnique({
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
    static async saveRefreshToken(userId, tokenHash, expiresAt) {
        return prisma_1.default.refreshToken.create({
            data: { userId, tokenHash, expiresAt },
        });
    }
    static async revokeRefreshToken(tokenHash) {
        return prisma_1.default.refreshToken.updateMany({
            where: { tokenHash },
            data: { revoked: true },
        });
    }
    static async findRefreshToken(tokenHash) {
        return prisma_1.default.refreshToken.findFirst({
            where: { tokenHash, revoked: false },
        });
    }
    static async updateUser(userId, data) {
        return prisma_1.default.user.update({
            where: { id: userId },
            data,
        });
    }
}
exports.AuthRepository = AuthRepository;
