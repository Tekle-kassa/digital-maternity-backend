import { AuthRepository } from "../auth/auth.repository";
import { AppError } from "../utils/AppError";
import { RoleRepository } from "./role.repository";

export class RoleService {
  static async listRoles() {
    return await RoleRepository.findAll();
  }
  static async assignRoleToUser(userId: string, roleName: string) {
    const role = await RoleRepository.findOne(roleName);
    if (!role) throw new AppError("Role not found", 404);
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);
    const hasRole = await RoleRepository.userHasRole(userId, role.id);
    if (hasRole) throw new AppError("User already has this role", 400);
    await RoleRepository.assignRole(userId, role.id);
    return { userId, roleName };
  }
  static async removeRoleFromUser(userId: string, roleName: string) {
    const role = await RoleRepository.findOne(roleName);
    if (!role) throw new AppError("Role not found", 404);
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);
    const hasRole = await RoleRepository.userHasRole(userId, role.id);
    if (!hasRole) throw new AppError("User does not have this role", 400);
    await RoleRepository.removeRole(userId, role.id);
    return { userId, roleName };
  }
}
