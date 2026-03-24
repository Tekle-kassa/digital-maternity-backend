import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, AuthRequest } from "../middleware/authMiddleware";
import { sendData } from "./helpers";

const router = Router();

/**
 * @swagger
 * /api/v1/activity:
 *   get:
 *     summary: Recent audit/activity log entries
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: patientId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: "{ data: array }"
 */
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
      const where: Record<string, unknown> = {};
      if (req.query.userId) where.userId = String(req.query.userId);
      if (req.query.patientId) where.patientId = String(req.query.patientId);

      const rows = await db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { user: true },
      });

      sendData(
        res,
        rows.map((a: any) => ({
          id: a.id,
          type: "system",
          description: a.action,
          userId: a.userId ?? "",
          userName: a.user?.fullName ?? a.user?.phone ?? "",
          patientId: undefined,
          patientName: undefined,
          timestamp: a.createdAt.toISOString(),
          metadata: (a.meta as Record<string, string>) ?? undefined,
        }))
      );
    } catch (e) {
      next(e);
    }
  }
);

export default router;
