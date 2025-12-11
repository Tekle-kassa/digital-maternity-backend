import prisma from "../config/prisma";
export class RoleRepository {
  static async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
    });
  }
  static async findAll() {
    return prisma.role.findMany();
  }
  static async findOne(name: string) {
    return prisma.role.findUnique({
      where: { name },
    });
  }
  static async userHasRole(userId: string, roleId: string) {
    const userRole = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    return !!userRole;
  }
  static async assignRole(userId: string, roleId: string) {
    return prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  static async removeRole(userId: string, roleId: string) {
    return prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  }
}
