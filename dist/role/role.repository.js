"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class RoleRepository {
    static async findById(id) {
        return prisma_1.default.role.findUnique({
            where: { id },
        });
    }
    static async findAll() {
        return prisma_1.default.role.findMany();
    }
    static async findOne(name) {
        return prisma_1.default.role.findUnique({
            where: { name },
        });
    }
    static async userHasRole(userId, roleId) {
        const userRole = await prisma_1.default.userRole.findUnique({
            where: { userId_roleId: { userId, roleId } },
        });
        return !!userRole;
    }
    static async assignRole(userId, roleId) {
        return prisma_1.default.userRole.upsert({
            where: { userId_roleId: { userId, roleId } },
            update: {},
            create: { userId, roleId },
        });
    }
    static async removeRole(userId, roleId) {
        return prisma_1.default.userRole.delete({
            where: { userId_roleId: { userId, roleId } },
        });
    }
}
exports.RoleRepository = RoleRepository;
