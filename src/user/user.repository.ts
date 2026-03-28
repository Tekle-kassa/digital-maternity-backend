import prisma from "../config/prisma";
import type { Prisma } from "../generated/prisma/client";

/** DB `Role.name` values that may appear as messaging recipients (medical staff + admins). */
export const STAFF_DIRECTORY_ROLE_NAMES: string[] = [
  "ADMIN",
  "MIDWIFE",
  "DOCTOR",
  "NURSE",
  "GBV_OFFICER",
  "SUPERVISOR",
];

const ins = "insensitive" as const;

function staffDirectoryWhere(
  excludeUserId: string,
  search?: string
): Prisma.UserWhereInput {
  const t = search?.trim();
  return {
    isActive: true,
    id: { not: excludeUserId },
    roles: {
      some: {
        role: {
          name: { in: STAFF_DIRECTORY_ROLE_NAMES },
        },
      },
    },
    ...(t
      ? {
          OR: [
            { fullName: { contains: t, mode: ins } },
            { phone: { contains: t, mode: ins } },
            { displayId: { contains: t, mode: ins } },
          ],
        }
      : {}),
  };
}

export class UserRepository {
  static async findStaffDirectory(
    excludeUserId: string,
    opts: { search?: string; limit?: number; offset?: number } = {}
  ) {
    const { limit = 50, offset = 0, search } = opts;
    return prisma.user.findMany({
      where: staffDirectoryWhere(excludeUserId, search),
      include: { roles: { include: { role: true } } },
      orderBy: [{ fullName: "asc" }, { phone: "asc" }],
      take: limit,
      skip: offset,
    });
  }

  static async countStaffDirectory(excludeUserId: string, search?: string) {
    return prisma.user.count({
      where: staffDirectoryWhere(excludeUserId, search),
    });
  }
}
