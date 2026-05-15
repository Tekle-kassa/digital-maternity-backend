import db from "../v1/db";
import {
  getMongoModelForEntity,
  listPrismaSyncEntities,
  PrismaSyncEntity,
} from "./entity-models";

function prismaDelegateName(entityType: PrismaSyncEntity): string {
  return entityType.charAt(0).toLowerCase() + entityType.slice(1);
}

function getDelegate(entityType: PrismaSyncEntity) {
  const key = prismaDelegateName(entityType);
  const delegate = (db as Record<string, { findMany: Function }>)[key];
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(`No Prisma delegate found for ${entityType}`);
  }
  return delegate;
}

function toSafePlainObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") return {};
  return JSON.parse(
    JSON.stringify(input, (_k, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  ) as Record<string, unknown>;
}

const UNSYNC_WHERE_BY_ENTITY: Partial<
  Record<PrismaSyncEntity, Record<string, unknown>>
> = {
  Patient: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  Visit: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  Ultrasound: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  GBVReport: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  GBVScreening: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  SRHRegistration: {
    OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }],
  },
  ANCRecord: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  Delivery: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  PNCVisit: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  Pregnancy: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  Referral: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  Message: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  Conversation: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
  User: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
};

export async function syncEntityFromPrismaToMongo(entityType: PrismaSyncEntity) {
  const delegate = getDelegate(entityType);
  const mongoModel = getMongoModelForEntity(entityType);
  const rows = (await delegate.findMany()) as Array<Record<string, unknown>>;

  if (rows.length === 0) {
    return { entityType, totalFromPrisma: 0, upserted: 0, deleted: 0 };
  }

  const ids = rows
    .map((r) => (typeof r.id === "string" ? r.id : null))
    .filter((v): v is string => Boolean(v));

  const operations = rows.map((row) => {
    const rowId = String(row.id);
    const setPayload = toSafePlainObject(row);
    return {
      updateOne: {
        filter: { id: rowId },
        update: {
          $set: setPayload,
        },
        upsert: true,
      },
    };
  });

  await mongoModel.bulkWrite(operations as any, { ordered: false });
  const deleteResult = await mongoModel.deleteMany({
    id: { $nin: ids },
  });

  return {
    entityType,
    totalFromPrisma: rows.length,
    upserted: rows.length,
    deleted: deleteResult.deletedCount ?? 0,
  };
}

export async function syncUnsyncedEntityFromPrismaToMongo(
  entityType: PrismaSyncEntity,
) {
  const delegate = getDelegate(entityType);
  const mongoModel = getMongoModelForEntity(entityType);
  const where = UNSYNC_WHERE_BY_ENTITY[entityType];
  const rows = (await delegate.findMany({
    ...(where ? { where } : {}),
  })) as Array<Record<string, unknown>>;

  if (rows.length === 0) {
    return { entityType, unsyncedFromPrisma: 0, upserted: 0 };
  }

  const operations = rows.map((row) => {
    const rowId = String(row.id);
    return {
      updateOne: {
        filter: { id: rowId },
        update: {
          $set: toSafePlainObject(row),
        },
        upsert: true,
      },
    };
  });

  await mongoModel.bulkWrite(operations as any, { ordered: false });

  return {
    entityType,
    unsyncedFromPrisma: rows.length,
    upserted: rows.length,
  };
}

export async function syncAllConfiguredEntitiesToMongo() {
  const results = [];
  for (const entity of listPrismaSyncEntities()) {
    const result = await syncEntityFromPrismaToMongo(entity);
    results.push(result);
  }
  return results;
}

export async function syncAllUnsyncedEntitiesToMongo() {
  const results = [];
  for (const entity of listPrismaSyncEntities()) {
    const result = await syncUnsyncedEntityFromPrismaToMongo(entity);
    results.push(result);
  }
  return results;
}
