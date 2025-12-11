"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const auth_repository_1 = require("../auth/auth.repository");
const AppError_1 = require("../utils/AppError");
const role_repository_1 = require("./role.repository");
class RoleService {
    static async listRoles() {
        return await role_repository_1.RoleRepository.findAll();
    }
    static async assignRoleToUser(userId, roleName) {
        const role = await role_repository_1.RoleRepository.findOne(roleName);
        if (!role)
            throw new AppError_1.AppError("Role not found", 404);
        const user = await auth_repository_1.AuthRepository.findUserById(userId);
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        const hasRole = await role_repository_1.RoleRepository.userHasRole(userId, role.id);
        if (hasRole)
            throw new AppError_1.AppError("User already has this role", 400);
        await role_repository_1.RoleRepository.assignRole(userId, role.id);
        return { userId, roleName };
    }
    static async removeRoleFromUser(userId, roleName) {
        const role = await role_repository_1.RoleRepository.findOne(roleName);
        if (!role)
            throw new AppError_1.AppError("Role not found", 404);
        const user = await auth_repository_1.AuthRepository.findUserById(userId);
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        const hasRole = await role_repository_1.RoleRepository.userHasRole(userId, role.id);
        if (!hasRole)
            throw new AppError_1.AppError("User does not have this role", 400);
        await role_repository_1.RoleRepository.removeRole(userId, role.id);
        return { userId, roleName };
    }
}
exports.RoleService = RoleService;
