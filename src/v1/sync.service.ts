import db from "./db";
import config from "../config";

export type SyncQueueActionType = "create" | "update" | "delete";

export async function enqueueSyncItem(input: {
  entityType: string;
  entityId: string;
  action: SyncQueueActionType;
  payload?: unknown;
}) {
  return db.syncQueueItem.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      payload: input.payload === undefined ? undefined : (input.payload as object),
      status: "pending",
    },
  });
}

export async function pushPendingToCentral(userId: string, limit = 50) {
  const baseUrl = config.centralSyncUrl;
  const secret = config.centralSyncSecret;
  const facilityId = config.facilityId;

  if (!baseUrl) {
    throw new Error("CENTRAL_SYNC_URL is not set (local server cannot push)");
  }
  if (!secret) {
    throw new Error("CENTRAL_SYNC_SECRET (or SYNC_INGEST_SECRET) is not set");
  }
  if (!facilityId) {
    throw new Error("FACILITY_ID is not set");
  }

  const items = await db.syncQueueItem.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  if (items.length === 0) {
    return { pushed: 0, duplicates: 0, message: "No pending items" };
  }

  const ids = items.map((i: { id: string }) => i.id);
  await db.syncQueueItem.updateMany({
    where: { id: { in: ids } },
    data: { status: "uploading", errorMessage: null },
  });

  const url = `${baseUrl}/api/v1/sync/ingest`;
  const body = {
    facilityId,
    clinicId: config.facilityClinicId || undefined,
    items: items.map((i: any) => ({
      id: i.id,
      entityType: i.entityType,
      entityId: i.entityId,
      action: i.action,
      payload: i.payload ?? undefined,
      createdAt: i.createdAt.toISOString(),
    })),
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sync-Ingest-Key": secret,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    await db.syncQueueItem.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "failed",
        errorMessage: e instanceof Error ? e.message : "Network error",
      },
    });
    await db.syncLog.create({
      data: {
        deviceId: "local-server",
        userId,
        recordsPushed: 0,
        recordsPulled: 0,
        status: "Failed",
      },
    });
    throw e;
  }

  const json = (await res.json().catch(() => ({}))) as {
    data?: { accepted?: number; duplicates?: number };
    error?: { message?: string };
  };

  if (!res.ok) {
    await db.syncQueueItem.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "failed",
        errorMessage: json?.error?.message || res.statusText || String(res.status),
      },
    });
    await db.syncLog.create({
      data: {
        deviceId: "local-server",
        userId,
        recordsPushed: 0,
        recordsPulled: 0,
        status: "Failed",
      },
    });
    throw new Error(json?.error?.message || `Central returned ${res.status}`);
  }

  const accepted = json?.data?.accepted ?? items.length;
  const duplicates = json?.data?.duplicates ?? 0;

  await db.syncQueueItem.updateMany({
    where: { id: { in: ids } },
    data: { status: "completed", progress: 100, errorMessage: null },
  });

  await db.syncLog.create({
    data: {
      deviceId: "local-server",
      userId,
      recordsPushed: accepted,
      recordsPulled: 0,
      status: "Success",
    },
  });

  return {
    pushed: items.length,
    accepted,
    duplicates,
    message: "Batch uploaded to central",
  };
}

export type IngestBatchBody = {
  facilityId: string;
  clinicId?: string;
  items: Array<{
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    payload?: unknown;
    createdAt?: string;
  }>;
};

export async function ingestBatchFromLocal(body: IngestBatchBody) {
  let accepted = 0;
  let duplicates = 0;

  for (const item of body.items) {
    const existing = await db.ingestedSyncMutation.findFirst({
      where: {
        facilityId: body.facilityId,
        sourceQueueItemId: item.id,
      },
    });
    if (existing) {
      duplicates += 1;
      continue;
    }
    await db.ingestedSyncMutation.create({
      data: {
        facilityId: body.facilityId,
        sourceQueueItemId: item.id,
        entityType: item.entityType,
        entityId: item.entityId,
        action: item.action,
        payload: item.payload === undefined ? undefined : (item.payload as object),
      },
    });
    accepted += 1;
  }

  return { accepted, duplicates };
}
