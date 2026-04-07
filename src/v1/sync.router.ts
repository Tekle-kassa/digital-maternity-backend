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

/**
 * @swagger
 * /api/v1/sync/ingest:
 *   post:
 *     summary: Receive sync batches from local (central server)
 *     description: |
 *       Receives batches at `POST /api/v1/sync/ingest` on your API host (default central origin `https://api.dmp.sofoniasayele.com`). No auth required.
 *
 *       Override with env `CENTRAL_SYNC_URL` on clients (origin only; path `/api/v1/sync/ingest` is appended).
 *
 *       Idempotency: duplicate item ids per facility are skipped (duplicates counted in response).
 *     tags: [Sync]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SyncIngestBatchRequest'
 *     responses:
 *       200:
 *         description: Success — response body contains data.accepted and data.duplicates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/SyncIngestSuccessData'
 */
/**
 * @swagger
 * /api/v1/sync/cron/{slug}/summary:
 *   get:
 *     summary: Row-level sync counts for one entity table
 *     description: |
 *       Local facility server or scheduler. Path slug is one of the enum values (e.g. patients maps to Prisma model Patient). No auth required.
 *     tags: [Sync]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/SyncCronSlug'
 *     responses:
 *       200:
 *         description: Success — see SyncCronSummaryData schema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/SyncCronSummaryData'
 * /api/v1/sync/cron/{slug}/push:
 *   post:
 *     summary: Push pending rows for one table to central ingest
 *     description: |
 *       Sends a batch to central POST /api/v1/sync/ingest using CENTRAL_SYNC_URL (default cloud API), FACILITY_ID, optional CENTRAL_SYNC_SECRET for outbound header.
 *     tags: [Sync]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/SyncCronSlug'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 25
 *     responses:
 *       200:
 *         description: Success — see SyncCronPushSuccessData schema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/SyncCronPushSuccessData'
 *       400:
 *         description: Central not configured or ingest failed
 */
for (const entityType of ENTITY_TYPES_FOR_CRON) {
  const slug = CRON_SLUG_BY_ENTITY[entityType as CronEntityType];
  const base = `/cron/${slug}`;

  router.get(
    `${base}/summary`,
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
 *     summary: Add a mutation to the local outbox (JWT; local server)
 *     description: |
 *       Pushes to central later via `POST /api/v1/sync/trigger` (or your own process calling ingest). Central does not call this endpoint.
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SyncEnqueueBody'
 *     responses:
 *       201:
 *         description: Created — data includes id and status of queued item
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
 *     description: Local facility UI; JWT.
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: lastSyncTime, pendingUploads, pendingDownloads, conflicts, … }"
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
 *     summary: Push pending `SyncQueueItem` rows to central ingest (JWT; local server)
 *     description: |
 *       Requires `FACILITY_ID` on the local server. Uses `CENTRAL_SYNC_URL` (defaults to cloud API). Optional `CENTRAL_SYNC_SECRET` adds outbound ingest header.
 *       Sends up to `limit` pending rows to **`POST /api/v1/sync/ingest`** on the central host.
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, minimum: 1, maximum: 100 }
 *     responses:
 *       200:
 *         description: Success — see SyncTriggerSuccessData schema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/SyncTriggerSuccessData'
 *       400:
 *         description: Not configured or central returned error
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
      if (!config.facilityId) {
        return sendError(
          res,
          "NOT_CONFIGURED",
          "Local→central sync requires FACILITY_ID (optional: CENTRAL_SYNC_URL to override default cloud API)",
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
 *     summary: Pending sync queue items (local outbox; JWT)
 *     tags: [Sync]
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
 *     tags: [Sync]
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
 *     tags: [Sync]
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
