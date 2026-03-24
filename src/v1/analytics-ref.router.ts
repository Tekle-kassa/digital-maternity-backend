import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, AuthRequest } from "../middleware/authMiddleware";
import { sendData } from "./helpers";
import { AnalyticsService } from "../analytics/analytics.service";

const router = Router();

/**
 * @swagger
 * /api/v1/analytics/dashboard-stats:
 *   get:
 *     summary: DMP dashboard KPIs (reference analytics)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.get(
  "/dashboard-stats",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const s = await AnalyticsService.getDashboardStats();
      sendData(res, {
        totalPatients: s.totalPatients,
        activePregnancies: s.activePregnancies,
        highRiskPatients: s.highRiskCount,
        visitsThisMonth: s.visitsThisMonth,
        teleconsultsThisMonth: 0,
        gbvReportsThisMonth: s.totalGBVCases,
        syncPendingCount: 0,
        appointmentsToday: s.appointmentsToday,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/visits-by-month:
 *   get:
 *     summary: Visits and new patients by month
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 6, maximum: 24 }
 *     responses:
 *       200:
 *         description: "{ data: { data: array } }"
 */
router.get(
  "/visits-by-month",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const months = Math.min(24, Math.max(1, parseInt(String(req.query.months ?? "6"), 10) || 6));
      const data: { month: string; visits: number; newPatients: number }[] = [];
      const now = new Date();
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const [visits, newPatients] = await Promise.all([
          db.visit.count({
            where: { visitDate: { gte: d, lt: next } },
          }),
          db.patient.count({
            where: { createdAt: { gte: d, lt: next } },
          }),
        ]);
        data.push({
          month: d.toISOString().slice(0, 7),
          visits,
          newPatients,
        });
      }
      sendData(res, { data });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/risk-distribution:
 *   get:
 *     summary: Risk level counts (placeholder)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.get(
  "/risk-distribution",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      sendData(res, {
        data: [
          { level: "low", count: 0 },
          { level: "medium", count: 0 },
          { level: "high", count: 0 },
          { level: "critical", count: 0 },
        ],
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/top-risk-factors:
 *   get:
 *     summary: Top risk factors (placeholder)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: { data: array } }"
 */
router.get(
  "/top-risk-factors",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      sendData(res, { data: [] as { factor: string; count: number }[] });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/gestational-age-distribution:
 *   get:
 *     summary: GA bucket counts (placeholder)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: { data: array } }"
 */
router.get(
  "/gestational-age-distribution",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      sendData(res, { data: [] as { range: string; count: number }[] });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/teleconsult-metrics:
 *   get:
 *     summary: Teleconsult volume and pending count
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.get(
  "/teleconsult-metrics",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [total, pending] = await Promise.all([
        db.teleconsultRequest.count(),
        db.teleconsultRequest.count({ where: { status: "pending" } }),
      ]);
      sendData(res, {
        totalRequests: total,
        avgResponseTime: 0,
        pendingCount: pending,
        resolvedCount: total - pending,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/overview:
 *   get:
 *     summary: Combined analytics bundle (dashboard, visits/month, telemetrics)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.get(
  "/overview",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [dashboardStats, visitsByMonth, teleconsultMetrics] = await Promise.all([
        AnalyticsService.getDashboardStats(),
        (async () => {
          const months = 6;
          const data: { month: string; visits: number; newPatients: number }[] = [];
          const now = new Date();
          for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const [visits, newPatients] = await Promise.all([
              db.visit.count({ where: { visitDate: { gte: d, lt: next } } }),
              db.patient.count({ where: { createdAt: { gte: d, lt: next } } }),
            ]);
            data.push({ month: d.toISOString().slice(0, 7), visits, newPatients });
          }
          return data;
        })(),
        (async () => {
          const total = await db.teleconsultRequest.count();
          const pending = await db.teleconsultRequest.count({ where: { status: "pending" } });
          return {
            totalRequests: total,
            avgResponseTime: 0,
            pendingCount: pending,
            resolvedCount: total - pending,
          };
        })(),
      ]);

      sendData(res, {
        dashboardStats: {
          totalPatients: dashboardStats.totalPatients,
          activePregnancies: dashboardStats.activePregnancies,
          highRiskPatients: dashboardStats.highRiskCount,
          visitsThisMonth: dashboardStats.visitsThisMonth,
          teleconsultsThisMonth: 0,
          gbvReportsThisMonth: dashboardStats.totalGBVCases,
          syncPendingCount: 0,
          appointmentsToday: dashboardStats.appointmentsToday,
        },
        visitsByMonth,
        riskDistribution: [],
        topRiskFactors: [],
        gestationalAgeDistribution: [],
        teleconsultMetrics,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
