import { Router, Response, NextFunction, Request } from "express";
import db from "./db";
import { AuthRequest } from "../middleware/authMiddleware";
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
import { connectMongoIfConfigured, isMongoConfigured } from "../config/mongo";
import { getMongoModelForEntity } from "../mongo/entity-models";
import {
  isS3UploadConfigured,
  uploadUltrasoundMedia,
} from "../common/s3Upload";

const router = Router();

async function ensureMongo(res: Response) {
  if (!isMongoConfigured()) {
    sendError(
      res,
      "MONGO_NOT_CONFIGURED",
      "Mongo sync requires cloud mode (`IS_CLOUD`) and `MONGODB_URI` (or `MONGO_URI`)",
      400,
    );
    return false;
  }
  await connectMongoIfConfigured();
  return true;
}

/**
 * Base URL for internal calls to Mongo `/pull` handlers. Localhost uses the
 * incoming request origin; otherwise `CENTRAL_SYNC_URL` (default
 * https://api.dmp.sofoniasayele.com). Override with `SYNC_INTERNAL_PULL_BASE_URL`.
 */
function getInternalSyncPullBaseUrl(req: Request): string | null {
  const override = process.env.IS_LOCAL
    ? "https://api.dmp.sofoniasayele.com"
    : "";
  if (override) return override;

  const hostHeader = req.get("host") ?? "";
  const hostname = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    process.env.SYNC_USE_LOCAL_PULL === "1" ||
    process.env.SYNC_USE_LOCAL_PULL === "true";

  if (isLocal) {
    if (!hostHeader) return null;
    const protoHeader = req.headers["x-forwarded-proto"];
    const proto = Array.isArray(protoHeader)
      ? protoHeader[0]
      : protoHeader || req.protocol || "http";
    return `${proto}://${hostHeader}`;
  }

  return config.centralSyncUrl;
}

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

/**
 * @swagger
 * /api/v1/sync/pattients/summary:
 *   post:
 *     summary: Summarize unsynced Patient rows from Prisma and POST to patient pull API
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: { unsyncedFromPrisma, pull } }"
 * /api/v1/sync/pattients/pull:
 *   post:
 *     summary: Store Patient rows into MongoDB (upsert by id)
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: "{ data: { stored } }"
 * /api/v1/sync/visits/summary:
 *   post: { summary: Summarize unsynced Visit rows and POST to visit pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/visits/pull:
 *   post: { summary: Store Visit rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/ultrasounds/summary:
 *   post: { summary: Summarize unsynced Ultrasound rows and POST to ultrasound pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/ultrasounds/pull:
 *   post: { summary: Store Ultrasound rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/gbv-reports/summary:
 *   post: { summary: Summarize unsynced GBVReport rows and POST to gbv-report pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/gbv-reports/pull:
 *   post: { summary: Store GBVReport rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/gbv-screenings/summary:
 *   post: { summary: Summarize unsynced GBVScreening rows and POST to gbv-screening pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/gbv-screenings/pull:
 *   post: { summary: Store GBVScreening rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/srh-registrations/summary:
 *   post: { summary: Summarize unsynced SRHRegistration rows and POST to srh-registration pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/srh-registrations/pull:
 *   post: { summary: Store SRHRegistration rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/anc-records/summary:
 *   post: { summary: Summarize unsynced ANCRecord rows and POST to anc-record pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/anc-records/pull:
 *   post: { summary: Store ANCRecord rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/deliveries/summary:
 *   post: { summary: Summarize unsynced Delivery rows and POST to delivery pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/deliveries/pull:
 *   post: { summary: Store Delivery rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/pnc-visits/summary:
 *   post: { summary: Summarize unsynced PNCVisit rows and POST to pnc-visit pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/pnc-visits/pull:
 *   post: { summary: Store PNCVisit rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/pregnancies/summary:
 *   post: { summary: Summarize unsynced Pregnancy rows and POST to pregnancy pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/pregnancies/pull:
 *   post: { summary: Store Pregnancy rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/referrals/summary:
 *   post: { summary: Summarize unsynced Referral rows and POST to referral pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/referrals/pull:
 *   post: { summary: Store Referral rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/messages/summary:
 *   post: { summary: Summarize unsynced Message rows and POST to message pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/messages/pull:
 *   post: { summary: Store Message rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/conversations/summary:
 *   post: { summary: Summarize unsynced Conversation rows and POST to conversation pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/conversations/pull:
 *   post: { summary: Store Conversation rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/users/summary:
 *   post: { summary: Summarize unsynced User rows and POST to user pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/users/pull:
 *   post: { summary: Store User rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/roles/summary:
 *   post: { summary: Summarize Role rows and POST to role pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/roles/pull:
 *   post: { summary: Store Role rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/user-roles/summary:
 *   post: { summary: Summarize UserRole rows and POST to user-role pull API, tags: [Sync], security: [{ bearerAuth: [] }] }
 * /api/v1/sync/user-roles/pull:
 *   post: { summary: Store UserRole rows into MongoDB, tags: [Sync], security: [{ bearerAuth: [] }] }
 */
router.post(
  "/pattients/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({
          items: z.array(z.record(z.string(), z.unknown())),
        })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("Patient");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));

      if (operations.length > 0) {
        await model.bulkWrite(operations as any, { ordered: false });
      }

      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/pattients/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const patients = await db.patient.findMany({
        // where: {
        //   OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }],
        // },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullUrl = `${baseUrl}/api/v1/sync/pattients/pull`;
      const authHeader = req.headers.authorization;
      const pullRes = await fetch(pullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof authHeader === "string"
            ? { Authorization: authHeader }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(patients, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });

      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok) {
        console.log(pullRes);
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed to store patients in Mongo",
          400,
        );
      }

      sendData(res, {
        unsyncedFromPrisma: patients.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  },
);

router.post(
  "/visits/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("Visit");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/visits/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await db.visit.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/visits/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/ultrasounds/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("Ultrasound");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/ultrasounds/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = (await db.ultrasound.findMany({
        // where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      })) as Array<Record<string, unknown>>;
      console.log(rows);
      const transformedRows: Array<Record<string, unknown>> = [];
      for (const row of rows) {
        const copy = JSON.parse(
          JSON.stringify(row, (_k, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ) as Record<string, unknown>;
        const imageUrl = copy.imageUrl;
        if (
          isS3UploadConfigured() &&
          typeof imageUrl === "string" &&
          imageUrl.length > 0
        ) {
          try {
            const mediaRes = await fetch(imageUrl);
            if (mediaRes.ok) {
              const mime =
                mediaRes.headers.get("content-type") ||
                "application/octet-stream";
              const buff = Buffer.from(await mediaRes.arrayBuffer());
              const uploadedUrl = await uploadUltrasoundMedia(buff, mime);
              copy.imageUrl = uploadedUrl;
              copy.originalImageUrl = imageUrl;
            }
          } catch {
            // Keep original imageUrl when download/upload fails.
          }
        }
        transformedRows.push(copy);
      }
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/ultrasounds/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: transformedRows,
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: transformedRows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/gbv-reports/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("GBVReport");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/gbv-reports/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await (db as any).gBVReport.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/gbv-reports/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/gbv-screenings/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("GBVScreening");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/gbv-screenings/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await (db as any).gBVScreening.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(
        `${baseUrl}/api/v1/sync/gbv-screenings/pull`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(typeof req.headers.authorization === "string"
              ? { Authorization: req.headers.authorization }
              : {}),
          },
          body: JSON.stringify({
            items: JSON.parse(
              JSON.stringify(rows, (_k, value) =>
                typeof value === "bigint" ? value.toString() : value,
              ),
            ),
          }),
        },
      );
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/srh-registrations/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("SRHRegistration");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/srh-registrations/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await (db as any).sRHRegistration.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(
        `${baseUrl}/api/v1/sync/srh-registrations/pull`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(typeof req.headers.authorization === "string"
              ? { Authorization: req.headers.authorization }
              : {}),
          },
          body: JSON.stringify({
            items: JSON.parse(
              JSON.stringify(rows, (_k, value) =>
                typeof value === "bigint" ? value.toString() : value,
              ),
            ),
          }),
        },
      );
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/anc-records/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("ANCRecord");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/anc-records/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await (db as any).aNCRecord.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/anc-records/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/deliveries/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("Delivery");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/deliveries/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await db.delivery.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/deliveries/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/pnc-visits/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("PNCVisit");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/pnc-visits/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await (db as any).pNCVisit.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/pnc-visits/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/pregnancies/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("Pregnancy");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/pregnancies/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await db.pregnancy.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/pregnancies/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/referrals/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("Referral");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/referrals/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await db.referral.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/referrals/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/messages/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("Message");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/messages/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await db.message.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/messages/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/conversations/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("Conversation");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/conversations/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await db.conversation.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/conversations/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/users/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("User");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/users/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await db.user.findMany({
        where: { OR: [{ syncStatus: { not: "synced" } }, { syncedAt: null }] },
      });
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/users/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/roles/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("Role");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/roles/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await db.role.findMany();
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/roles/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/user-roles/pull",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const body = z
        .object({ items: z.array(z.record(z.string(), z.unknown())) })
        .parse(req.body ?? {});
      const model = getMongoModelForEntity("UserRole");
      const operations = body.items
        .filter((item) => typeof item.id === "string" && item.id.length > 0)
        .map((item) => ({
          updateOne: {
            filter: { id: item.id as string },
            update: { $set: item },
            upsert: true,
          },
        }));
      if (operations.length > 0)
        await model.bulkWrite(operations as any, { ordered: false });
      sendData(res, { stored: operations.length });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/user-roles/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rows = await db.userRole.findMany();
      const baseUrl = getInternalSyncPullBaseUrl(req);
      if (!baseUrl)
        return sendError(res, "BAD_REQUEST", "Missing host header", 400);
      const pullRes = await fetch(`${baseUrl}/api/v1/sync/user-roles/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof req.headers.authorization === "string"
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify({
          items: JSON.parse(
            JSON.stringify(rows, (_k, value) =>
              typeof value === "bigint" ? value.toString() : value,
            ),
          ),
        }),
      });
      const pullJson = (await pullRes.json().catch(() => ({}))) as {
        data?: Record<string, unknown>;
        error?: { message?: string };
      };
      if (!pullRes.ok)
        return sendError(
          res,
          "PULL_FAILED",
          pullJson?.error?.message || "Failed",
          400,
        );
      sendData(res, {
        unsyncedFromPrisma: rows.length,
        pull: pullJson?.data ?? {},
      });
    } catch (e) {
      next(e);
    }
  },
);

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
 * /api/v1/sync/patients/pending-all:
 *   post:
 *     summary: Set all Patient rows syncStatus to pending
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: { updated: number } }"
 */
router.post(
  "/patients/pending-all",
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await db.patient.updateMany({
        data: {
          syncStatus: "pending",
          syncedAt: null,
          syncError: null,
        },
      });
      sendData(res, { updated: result.count });
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
