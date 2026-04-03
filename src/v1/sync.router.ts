import { Router, Response, NextFunction, Request } from "express";
import db from "./db";
import { authenticate, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError } from "./helpers";
import { z } from "zod";
import config from "../config";
import {
  enqueueSyncItem,
  ingestBatchFromLocal,
  pushPendingToCentral,
} from "./sync.service";
import {
  CRON_SLUG_BY_ENTITY,
  ENTITY_TYPES_FOR_CRON,
  getEntitySyncCronSummaryFor,
  pushPendingEntityTableToCentral,
  type CronEntityType,
} from "./sync-cron.service";

const router = Router();

function syncCronAuth(req: Request, res: Response, next: NextFunction) {
  if (!config.syncCronSecret) {
    return sendError(
      res,
      "NOT_CONFIGURED",
      "Entity sync cron is disabled (set SYNC_CRON_SECRET)",
      503,
    );
  }
  const key = req.headers["x-sync-cron-secret"];
  if (typeof key !== "string" || key !== config.syncCronSecret) {
    return sendError(
      res,
      "UNAUTHORIZED",
      "Invalid or missing X-Sync-Cron-Secret header",
      401,
    );
  }
  next();
}

function syncIngestAuth(req: Request, res: Response, next: NextFunction) {
  if (!config.syncIngestSecret) {
    return sendError(
      res,
      "NOT_CONFIGURED",
      "Sync ingest is disabled (set SYNC_INGEST_SECRET on the central server)",
      503,
    );
  }
  const key = req.headers["x-sync-ingest-key"];
  if (typeof key !== "string" || key !== config.syncIngestSecret) {
    return sendError(res, "UNAUTHORIZED", "Invalid sync ingest key", 401);
  }
  next();
}

/**
 * @swagger
 * /api/v1/sync/ingest:
 *   post:
 *     summary: Central ingest (local server pushes batches here)
 *     description: |
 *       **Central deployment only.** Authenticate with header `X-Sync-Ingest-Key` (same value as `SYNC_INGEST_SECRET`).
 *       Local server uses `SYNC_INGEST_SECRET` as `CENTRAL_SYNC_SECRET` when calling outbound.
 *     tags: [DMP]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-Sync-Ingest-Key
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [facilityId, items]
 *     responses:
 *       200:
 *         description: accepted and duplicate counts
 *       401:
 *         description: Invalid key
 *       503:
 *         description: Ingest not configured
 */
/**
 * @swagger
 * /api/v1/sync/cron/patients/summary:
 *   get:
 *     summary: Row sync counts for one table (cron)
 *     tags: [DMP]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-Sync-Cron-Secret
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "{ entityType, slug, pending, synced, conflict }" }
 * /api/v1/sync/cron/patients/push:
 *   post:
 *     summary: Push pending rows for one table to central (cron)
 *     tags: [DMP]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-Sync-Cron-Secret
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit: { type: integer, default: 25, maximum: 100 }
 *     responses:
 *       200: { description: push result }
 *       400: { description: sync failed }
 *
 * Slugs — patients, users, visits, ultrasounds, gbv-reports, gbv-screenings, srh-registrations,
 * referrals, pregnancies, anc-records, deliveries, newborns, pnc-visits, conversations, messages,
 * teleconsult-requests. Response `entityType` is the Prisma model name.
 */
console.log("asd");
for (const entityType of ENTITY_TYPES_FOR_CRON) {
  const slug = CRON_SLUG_BY_ENTITY[entityType as CronEntityType];
  const base = `/cron/${slug}`;

  router.get(
    `${base}/summary`,
    syncCronAuth,
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const counts = await getEntitySyncCronSummaryFor(
          entityType as CronEntityType,
        );
        sendData(res, { entityType, slug, ...counts });
      } catch (e) {
        next(e);
      }
    },
  );

  router.post(
    `${base}/push`,
    syncCronAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = z
          .object({
            limit: z.coerce.number().int().min(1).max(100).optional(),
          })
          .parse(req.body ?? {});
        const result = await pushPendingEntityTableToCentral(
          entityType as CronEntityType,
          body.limit,
        );
        if (result.error) {
          return sendError(res, "SYNC_FAILED", result.error, 400);
        }
        sendData(res, { entityType, slug, ...result });
      } catch (e) {
        next(e);
      }
    },
  );
}

router.post(
  "/ingest",
  syncIngestAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          facilityId: z.string().min(1),
          clinicId: z.string().optional(),
          items: z.array(
            z.object({
              id: z.string().uuid(),
              entityType: z.string(),
              entityId: z.string(),
              action: z.string(),
              payload: z.unknown().optional(),
              createdAt: z.string().optional(),
            }),
          ),
        })
        .parse(req.body);
      const result = await ingestBatchFromLocal(body);
      sendData(res, result);
    } catch (e) {
      next(e);
    }
  },
);

/**
 * @swagger
 * /api/v1/sync/enqueue:
 *   post:
 *     summary: Add a mutation to the local outbox (to be pushed to central)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entityType, entityId, action]
 *     responses:
 *       201:
 *         description: Queue item created
 */
router.post(
  "/enqueue",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          entityType: z.string().min(1),
          entityId: z.string().uuid(),
          action: z.enum(["create", "update", "delete"]),
          payload: z.unknown().optional(),
        })
        .parse(req.body);
      const row = await enqueueSyncItem(body);
      sendData(res, { id: row.id, status: row.status }, 201);
    } catch (e) {
      next(e);
    }
  },
);

/**
 * @swagger
 * /api/v1/sync/status:
 *   get:
 *     summary: Sync status for current user (last sync, pending, conflicts)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.get(
  "/status",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const last = await db.syncLog.findFirst({
        where: { userId: req.user!.id },
        orderBy: { syncTimestamp: "desc" },
      });
      const [pendingUploads, conflicts] = await Promise.all([
        db.syncQueueItem.count({ where: { status: "pending" } }),
        db.syncConflict.count({ where: { resolved: false } }),
      ]);
      sendData(res, {
        lastSyncTime:
          last?.syncTimestamp.toISOString() ?? new Date().toISOString(),
        pendingUploads,
        pendingDownloads: 0,
        conflicts,
        isOnline: true,
        syncProgress: undefined,
        lastError: undefined,
      });
    } catch (e) {
      next(e);
    }
  },
);

/**
 * @swagger
 * /api/v1/sync/trigger:
 *   post:
 *     summary: Push pending outbox queue to the central server (Option B)
 *     description: |
 *       Requires `CENTRAL_SYNC_URL`, `FACILITY_ID`, and shared secret on the **local** server.
 *       Drains up to `limit` pending `SyncQueueItem` rows and POSTs them to central `/api/v1/sync/ingest`.
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *     responses:
 *       200:
 *         description: Push result
 *       400:
 *         description: Central not configured or push failed
 */
router.post(
  "/trigger",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(
        100,
        Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50),
      );
      if (!config.centralSyncUrl) {
        return sendError(
          res,
          "NOT_CONFIGURED",
          "Local→central sync is not configured (set CENTRAL_SYNC_URL, FACILITY_ID, CENTRAL_SYNC_SECRET)",
          400,
        );
      }
      const result = await pushPendingToCentral(req.user!.id, limit);
      sendData(res, result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sync failed";
      sendError(res, "SYNC_FAILED", msg, 400);
    }
  },
);

/**
 * @swagger
 * /api/v1/sync/queue:
 *   get:
 *     summary: Pending sync queue items
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: array }"
 */
router.get(
  "/queue",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const items = await db.syncQueueItem.findMany({
        where: { status: { in: ["pending", "uploading", "downloading"] } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      sendData(
        res,
        items.map((i: any) => ({
          id: i.id,
          type: i.entityType,
          action: i.action.toLowerCase(),
          status: i.status.toLowerCase(),
          timestamp: i.createdAt.toISOString(),
          progress: i.progress ?? undefined,
        })),
      );
    } catch (e) {
      next(e);
    }
  },
);

/**
 * @swagger
 * /api/v1/sync/conflicts:
 *   get:
 *     summary: Unresolved sync conflicts
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: array }"
 */
router.get(
  "/conflicts",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await db.syncConflict.findMany({
        where: { resolved: false },
        include: { patient: true },
        take: 50,
      });
      sendData(
        res,
        rows.map((c: any) => ({
          id: c.id,
          patientId: c.patientId,
          patientName: c.patient.fullName,
          field: c.field,
          localValue: c.localValue,
          serverValue: c.serverValue,
          localTimestamp: c.localTimestamp.toISOString(),
          serverTimestamp: c.serverTimestamp.toISOString(),
        })),
      );
    } catch (e) {
      next(e);
    }
  },
);

/**
 * @swagger
 * /api/v1/sync/conflicts/{id}/resolve:
 *   post:
 *     summary: Resolve a sync conflict
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resolution]
 *             properties:
 *               resolution:
 *                 type: string
 *                 enum: [keep_local, keep_server, merge]
 *               mergedValue: { type: string }
 *     responses:
 *       200:
 *         description: "{ data: { ok: true } }"
 */
router.post(
  "/conflicts/:id/resolve",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          resolution: z.enum(["keep_local", "keep_server", "merge"]),
          mergedValue: z.string().optional(),
        })
        .parse(req.body);
      await db.syncConflict.update({
        where: { id: req.params.id },
        data: {
          resolved: true,
          resolution: body.resolution,
          resolvedAt: new Date(),
        },
      });
      sendData(res, { ok: true });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
