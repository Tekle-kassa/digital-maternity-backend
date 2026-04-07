import { randomUUID } from "node:crypto";
import db from "./db";
import config from "../config";
import { postCentralIngest, type IngestBatchBody } from "./sync.service";

/** Entity table names included in row-level cron sync (matches Prisma model names). */
export const ENTITY_TYPES_FOR_CRON = [
  "Patient",
  "User",
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
] as const;

export type CronEntityType = (typeof ENTITY_TYPES_FOR_CRON)[number];

const ENTITY_SET = new Set<string>(ENTITY_TYPES_FOR_CRON);

/** Kebab-style URL segment: `/api/v1/sync/cron/{slug}/summary` */
export const CRON_SLUG_BY_ENTITY: Record<CronEntityType, string> = {
  Patient: "patients",
  User: "users",
  Visit: "visits",
  Ultrasound: "ultrasounds",
  GBVReport: "gbv-reports",
  GBVScreening: "gbv-screenings",
  SRHRegistration: "srh-registrations",
  Referral: "referrals",
  Pregnancy: "pregnancies",
  ANCRecord: "anc-records",
  Delivery: "deliveries",
  Newborn: "newborns",
  PNCVisit: "pnc-visits",
  Conversation: "conversations",
  Message: "messages",
  TeleconsultRequest: "teleconsult-requests",
};

const SLUG_TO_ENTITY = new Map<string, CronEntityType>(
  (Object.entries(CRON_SLUG_BY_ENTITY) as [CronEntityType, string][]).map(([e, s]) => [s, e])
);

export function cronEntityTypeFromSlug(slug: string): CronEntityType | null {
  return SLUG_TO_ENTITY.get(slug) ?? null;
}

export const CRON_ENTITY_SLUGS = Object.values(CRON_SLUG_BY_ENTITY);

export function isCronEntityType(name: string): name is CronEntityType {
  return ENTITY_SET.has(name);
}

function prismaDelegateName(entityType: string): string {
  return entityType.charAt(0).toLowerCase() + entityType.slice(1);
}

function getDelegate(entityType: string) {
  const key = prismaDelegateName(entityType);
  const d = (db as Record<
    string,
    { findMany: Function; updateMany: Function; count: Function; aggregate: Function }
  >)[key];
  if (!d || typeof d.findMany !== "function" || typeof d.aggregate !== "function") {
    throw new Error(`No Prisma delegate for entity type ${entityType}`);
  }
  return d;
}

function jsonSafePayload(row: Record<string, unknown>): Record<string, unknown> {
  const raw = JSON.parse(
    JSON.stringify(row, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  ) as Record<string, unknown>;
  if ("passwordHash" in raw) {
    const { passwordHash: _p, ...rest } = raw;
    return rest;
  }
  return raw;
}

export type EntitySyncCounts = {
  pending: number;
  synced: number;
  conflict: number;
  /** Latest `createdAt` among pending rows. */
  maxPendingChangeAt: string | null;
  /** Latest `createdAt` in the whole table. */
  maxTableChangeAt: string | null;
};

export async function getEntitySyncCronSummaryFor(entityType: CronEntityType): Promise<EntitySyncCounts> {
  const del = getDelegate(entityType);
  const [pending, synced, conflict, pendingAgg, tableAgg] = await Promise.all([
    del.count({ where: { syncStatus: "pending" } }),
    del.count({ where: { syncStatus: "synced" } }),
    del.count({ where: { syncStatus: "conflict" } }),
    del.aggregate({
      where: { syncStatus: "pending" },
      _max: { createdAt: true },
    }),
    del.aggregate({ _max: { createdAt: true } }),
  ]);
  const pendingTs = pendingAgg._max.createdAt;
  const tableTs = tableAgg._max.createdAt;
  return {
    pending,
    synced,
    conflict,
    maxPendingChangeAt: pendingTs instanceof Date ? pendingTs.toISOString() : null,
    maxTableChangeAt: tableTs instanceof Date ? tableTs.toISOString() : null,
  };
}

type RowRef = { entityType: CronEntityType; entityId: string };

async function markRows(
  refs: RowRef[],
  data: { syncStatus: string; syncedAt?: Date | null; syncError?: string | null }
): Promise<void> {
  const byType = new Map<CronEntityType, string[]>();
  for (const r of refs) {
    const list = byType.get(r.entityType) ?? [];
    list.push(r.entityId);
    byType.set(r.entityType, list);
  }
  for (const [entityType, ids] of byType) {
    if (ids.length === 0) continue;
    const del = getDelegate(entityType);
    await del.updateMany({ where: { id: { in: ids } }, data });
  }
}

export async function pushPendingEntityRowsToCentral(input: {
  entityTypes?: CronEntityType[];
  limitPerType?: number;
  maxTotalItems?: number;
}): Promise<{
  itemCount: number;
  entityTypesTouched: string[];
  central?: { accepted?: number; duplicates?: number };
  error?: string;
}> {
  const limitPerType = Math.min(100, Math.max(1, input.limitPerType ?? 25));
  const maxTotal = Math.min(500, Math.max(1, input.maxTotalItems ?? 200));
  const facilityId = config.facilityId;
  if (!config.centralSyncUrl) {
    return { itemCount: 0, entityTypesTouched: [], error: "CENTRAL_SYNC_URL is not set" };
  }
  if (!facilityId) {
    return { itemCount: 0, entityTypesTouched: [], error: "FACILITY_ID not set" };
  }

  const types = (input.entityTypes?.length ? input.entityTypes : [...ENTITY_TYPES_FOR_CRON]).filter((t) =>
    ENTITY_SET.has(t)
  );

  const items: IngestBatchBody["items"] = [];
  const refs: RowRef[] = [];
  const touched = new Set<string>();

  for (const entityType of types) {
    if (items.length >= maxTotal) break;
    const take = Math.min(limitPerType, maxTotal - items.length);
    const del = getDelegate(entityType);
    const rows = (await del.findMany({
      where: { syncStatus: "pending" },
      orderBy: { createdAt: "asc" },
      take,
    })) as Array<{ id: string; createdAt: Date }>;

    for (const row of rows) {
      const payload = jsonSafePayload(row as unknown as Record<string, unknown>);
      const stamp = row.createdAt;
      items.push({
        id: randomUUID(),
        entityType,
        entityId: row.id,
        action: "update",
        payload,
        createdAt: stamp instanceof Date ? stamp.toISOString() : undefined,
      });
      refs.push({ entityType: entityType as CronEntityType, entityId: row.id });
      touched.add(entityType);
    }
  }

  if (items.length === 0) {
    return { itemCount: 0, entityTypesTouched: [] };
  }

  const body: IngestBatchBody = {
    facilityId,
    clinicId: config.facilityClinicId || undefined,
    items,
  };

  const result = await postCentralIngest(body);

  if (!result.ok) {
    const msg = result.errorMessage || "Ingest failed";
    await markRows(refs, { syncStatus: "pending", syncError: msg, syncedAt: null });
    return {
      itemCount: items.length,
      entityTypesTouched: [...touched],
      error: msg,
    };
  }

  await markRows(refs, { syncStatus: "synced", syncError: null, syncedAt: new Date() });

  const logUserId =
    config.syncCronActingUserId ||
    (await db.user.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }))?.id;
  if (logUserId) {
    await db.syncLog.create({
      data: {
        deviceId: "cron-entity-rows",
        userId: logUserId,
        recordsPushed: result.accepted ?? items.length,
        recordsPulled: 0,
        status: "Success",
      },
    });
  }

  return {
    itemCount: items.length,
    entityTypesTouched: [...touched],
    central: { accepted: result.accepted, duplicates: result.duplicates },
  };
}

/** Push pending rows for a single Prisma model (one cron job per table). */
export function pushPendingEntityTableToCentral(entityType: CronEntityType, limit?: number) {
  const lim = Math.min(100, Math.max(1, limit ?? 25));
  return pushPendingEntityRowsToCentral({
    entityTypes: [entityType],
    limitPerType: lim,
    maxTotalItems: lim,
  });
}
