import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError } from "./helpers";
import { mapUserToApiResponse } from "./mappers";
import { z } from "zod";

const router = Router();

/**
 * @swagger
 * /api/v1/settings/profile:
 *   get:
 *     summary: Current user profile (DMP shape)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.get(
  "/profile",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const u = await db.user.findUnique({
        where: { id: req.user!.id },
        include: { roles: { include: { role: true } }, clinic: true },
      });
      if (!u) return sendError(res, "NOT_FOUND", "Not found", 404);
      sendData(res, mapUserToApiResponse(u as any));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/settings/profile:
 *   patch:
 *     summary: Update profile name/email
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.patch(
  "/profile",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          name: z.string().optional(),
          email: z.string().email().optional(),
        })
        .parse(req.body);
      const u = await db.user.update({
        where: { id: req.user!.id },
        data: { fullName: body.name, email: body.email },
        include: { roles: { include: { role: true } }, clinic: true },
      });
      sendData(res, mapUserToApiResponse(u as any));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/settings/notifications:
 *   get:
 *     summary: Notification preferences
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.get(
  "/notifications",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      let pref = await db.notificationPreference.findUnique({
        where: { userId: req.user!.id },
      });
      if (!pref) {
        pref = await db.notificationPreference.create({
          data: { userId: req.user!.id },
        });
      }
      sendData(res, {
        emailAlerts: pref.emailAlerts,
        smsAlerts: pref.smsAlerts,
        criticalOnly: pref.criticalOnly,
        alertTypes: {
          appointment: pref.alertAppointment,
          risk: pref.alertRisk,
          teleconsult: pref.alertTeleconsult,
          sync: pref.alertSync,
          system: pref.alertSystem,
          gbv: pref.alertGbv,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/settings/notifications:
 *   patch:
 *     summary: Update notification preferences
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.patch(
  "/notifications",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          emailAlerts: z.boolean().optional(),
          smsAlerts: z.boolean().optional(),
          criticalOnly: z.boolean().optional(),
          alertTypes: z
            .object({
              appointment: z.boolean().optional(),
              risk: z.boolean().optional(),
              teleconsult: z.boolean().optional(),
              sync: z.boolean().optional(),
              system: z.boolean().optional(),
              gbv: z.boolean().optional(),
            })
            .optional(),
        })
        .parse(req.body);
      const at = body.alertTypes;
      const pref = await db.notificationPreference.upsert({
        where: { userId: req.user!.id },
        create: {
          userId: req.user!.id,
          emailAlerts: body.emailAlerts ?? true,
          smsAlerts: body.smsAlerts ?? false,
          criticalOnly: body.criticalOnly ?? false,
          alertAppointment: at?.appointment ?? true,
          alertRisk: at?.risk ?? true,
          alertTeleconsult: at?.teleconsult ?? true,
          alertSync: at?.sync ?? true,
          alertSystem: at?.system ?? true,
          alertGbv: at?.gbv ?? true,
        },
        update: {
          emailAlerts: body.emailAlerts,
          smsAlerts: body.smsAlerts,
          criticalOnly: body.criticalOnly,
          alertAppointment: at?.appointment,
          alertRisk: at?.risk,
          alertTeleconsult: at?.teleconsult,
          alertSync: at?.sync,
          alertSystem: at?.system,
          alertGbv: at?.gbv,
        },
      });
      sendData(res, {
        emailAlerts: pref.emailAlerts,
        smsAlerts: pref.smsAlerts,
        criticalOnly: pref.criticalOnly,
        alertTypes: {
          appointment: pref.alertAppointment,
          risk: pref.alertRisk,
          teleconsult: pref.alertTeleconsult,
          sync: pref.alertSync,
          system: pref.alertSystem,
          gbv: pref.alertGbv,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/settings/security:
 *   get:
 *     summary: Security settings and active sessions
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.get(
  "/security",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const sessions = await db.userSession.findMany({
        where: { userId: req.user!.id },
        orderBy: { lastActive: "desc" },
      });
      sendData(res, {
        twoFactorEnabled: false,
        sessionTimeout: 60,
        activeSessions: sessions.map((s: any) => ({
          id: s.id,
          device: s.device ?? "unknown",
          ip: s.ipAddress ?? "",
          lastActive: s.lastActive.toISOString(),
        })),
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/settings/security:
 *   patch:
 *     summary: Update security settings (no-op placeholder)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: { ok: true } }"
 */
router.patch(
  "/security",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      sendData(res, { ok: true });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/settings/security/sessions/{id}:
 *   delete:
 *     summary: Revoke a session
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
  "/security/sessions/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await db.userSession.deleteMany({
        where: { id: req.params.id, userId: req.user!.id },
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
