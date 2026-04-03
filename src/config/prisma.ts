// src/prisma.ts
// import { PrismaClient } from "@prisma/client";
// import { PrismaClient } from "../generated/prisma/client";
import { PrismaClient } from "../generated/prisma/client";
import { extendPrismaWithSyncPending } from "./prismaSyncExtension";

const base = new PrismaClient();
const prisma = extendPrismaWithSyncPending(base);

export default prisma as unknown as PrismaClient;
