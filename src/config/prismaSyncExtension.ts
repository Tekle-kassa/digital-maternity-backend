import { PrismaClient } from "../generated/prisma/client";

/** Models that carry `syncStatus` / `syncedAt` / `syncError` for local→central row sync. */
const MODELS_WITH_ROW_SYNC = new Set([
  "User",
  "Patient",
  "Visit",
  "Ultrasound",
  "GBVReport",
  "GBVScreening",
  "SRHRegistration",
  "Referral",
  "Pregnancy",
  "ANCRecord",
  "Delivery",
  "Newborn",
  "PNCVisit",
  "Conversation",
  "Message",
  "TeleconsultRequest",
]);

const SYNC_META_KEYS = new Set(["syncError", "syncedAt", "syncStatus"]);

function isPureSyncMetaUpdate(data: Record<string, unknown>): boolean {
  const keys = Object.keys(data);
  return keys.length > 0 && keys.every((k) => SYNC_META_KEYS.has(k));
}

function shouldSkipSyncBump(model: string, data: Record<string, unknown>): boolean {
  if (data.syncStatus === "synced" || data.syncStatus === "conflict") return true;
  if (isPureSyncMetaUpdate(data)) return true;
  if (model === "User") {
    const substantive = Object.keys(data).filter((k) => !SYNC_META_KEYS.has(k));
    if (substantive.length === 1 && substantive[0] === "passwordHash") return true;
  }
  return false;
}

function bumpSyncPending<T extends Record<string, unknown>>(data: T): T {
  return {
    ...data,
    syncStatus: "pending",
    syncedAt: null,
    syncError: null,
  } as T;
}

export function extendPrismaWithSyncPending(client: PrismaClient) {
  return client.$extends({
    query: {
      $allModels: {
        async update({ model, args, query }: { model: string; args: { data: unknown }; query: (a: unknown) => unknown }) {
          if (!MODELS_WITH_ROW_SYNC.has(model)) {
            return query(args);
          }
          const data = args.data as Record<string, unknown>;
          if (data == null || typeof data !== "object") {
            return query(args);
          }
          if (shouldSkipSyncBump(model, data)) {
            return query(args);
          }
          args.data = bumpSyncPending(data);
          return query(args);
        },
      },
    },
  });
}
