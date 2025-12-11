import prisma from "../config/prisma";

export async function log(
  userId: string | null,
  action: string,
  meta: any = {},
  ip: string | null = null
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        meta,
        ip,
      },
    });
  } catch (err) {
    // don't block flow on audit failure
    // consider pushing to a queue in production
    // eslint-disable-next-line no-console
    console.error("Audit log failed", err);
  }
}
