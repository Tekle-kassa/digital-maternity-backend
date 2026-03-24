import prisma from "../config/prisma";

/** Prisma client with DMP models; use until `npx prisma generate` succeeds locally. */
const db = prisma as any;
export default db;
