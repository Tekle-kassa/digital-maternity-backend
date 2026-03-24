import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError, parsePagination, meta } from "./helpers";
import { z } from "zod";

const router = Router();

/**
 * @swagger
 * /api/v1/alerts/count:
 *   get:
 *     summary: Unread and action-required counts for current user
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: { unread, actionRequired } }"
 */
router.get(
  "/count",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const uid = req.user!.id;
      const [unread, actionRequired] = await Promise.all([
        db.userAlert.count({ where: { targetUserId: uid, readAt: null } }),
        db.userAlert.count({ where: { targetUserId: uid, actionRequired: true, readAt: null } }),
      ]);
      sendData(res, { unread, actionRequired });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/alerts/read-all:
 *   patch:
 *     summary: Mark all alerts read for current user
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: { ok: true } }"
 */
router.patch(
  "/read-all",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await db.userAlert.updateMany({
        where: { targetUserId: req.user!.id, readAt: null },
        data: { readAt: new Date() },
      });
      sendData(res, { ok: true });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/alerts:
 *   get:
 *     summary: List alerts for current user
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "{ data, meta }"
 */
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
      const where: Record<string, unknown> = { targetUserId: req.user!.id };
      if (req.query.unreadOnly === "true") where.readAt = null;

      const total = await db.userAlert.count({ where });
      const rows = await db.userAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      sendData(
        res,
        rows.map((a: any) => ({
          id: a.id,
          type: a.type.toLowerCase(),
          priority: a.priority.toLowerCase(),
          title: a.title,
          message: a.message,
          patientId: a.patientId ?? undefined,
          createdAt: a.createdAt.toISOString(),
          readAt: a.readAt?.toISOString(),
          acknowledgedAt: a.acknowledgedAt?.toISOString(),
          actionRequired: a.actionRequired,
          actionUrl: a.actionUrl ?? undefined,
        })),
        200,
        meta(page, limit, total)
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/alerts/{id}:
 *   get:
 *     summary: Alert by id (current user)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.get(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const a = await db.userAlert.findFirst({
        where: { id: req.params.id, targetUserId: req.user!.id },
      });
      if (!a) return sendError(res, "NOT_FOUND", "Not found", 404);
      sendData(res, {
        id: a.id,
        type: a.type.toLowerCase(),
        priority: a.priority.toLowerCase(),
        title: a.title,
        message: a.message,
        createdAt: a.createdAt.toISOString(),
        readAt: a.readAt?.toISOString(),
        acknowledgedAt: a.acknowledgedAt?.toISOString(),
        actionRequired: a.actionRequired,
        actionUrl: a.actionUrl ?? undefined,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/alerts/{id}/read:
 *   patch:
 *     summary: Mark one alert read
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: "{ data: { ok: true } }"
 */
router.patch(
  "/:id/read",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const a = await db.userAlert.updateMany({
        where: { id: req.params.id, targetUserId: req.user!.id },
        data: { readAt: new Date() },
      });
      if (a.count === 0) return sendError(res, "NOT_FOUND", "Not found", 404);
      sendData(res, { ok: true });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/alerts/{id}/acknowledge:
 *   patch:
 *     summary: Acknowledge alert
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: "{ data: { ok: true } }"
 */
router.patch(
  "/:id/acknowledge",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const a = await db.userAlert.updateMany({
        where: { id: req.params.id, targetUserId: req.user!.id },
        data: {
          acknowledgedAt: new Date(),
          acknowledgedById: req.user!.id,
        },
      });
      if (a.count === 0) return sendError(res, "NOT_FOUND", "Not found", 404);
      sendData(res, { ok: true });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/alerts:
 *   post:
 *     summary: Create alert(s) for target user(s) (admin)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, priority, title, message, actionRequired]
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          type: z.enum(["appointment", "risk", "teleconsult", "sync", "system", "gbv"]),
          priority: z.enum(["low", "medium", "high", "critical"]),
          title: z.string(),
          message: z.string(),
          patientId: z.string().uuid().optional(),
          actionRequired: z.boolean(),
          actionUrl: z.string().optional(),
          targetUserIds: z.array(z.string().uuid()).optional(),
        })
        .parse(req.body);
      const targets = body.targetUserIds?.length ? body.targetUserIds : [req.user!.id];
      for (const uid of targets) {
        await db.userAlert.create({
          data: {
            type: body.type,
            priority: body.priority,
            title: body.title,
            message: body.message,
            patientId: body.patientId,
            targetUserId: uid,
            actionRequired: body.actionRequired,
            actionUrl: body.actionUrl,
          },
        });
      }
      sendData(res, { ok: true }, 201);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/alerts/{id}:
 *   delete:
 *     summary: Delete alert (current user)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: No content
 */
router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const r = await db.userAlert.deleteMany({
        where: { id: req.params.id, targetUserId: req.user!.id },
      });
      if (r.count === 0) return sendError(res, "NOT_FOUND", "Not found", 404);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
