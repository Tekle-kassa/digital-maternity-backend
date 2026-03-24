import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import analyticsRefRouter from "../v1/analytics-ref.router";

const ALLOWED = ["MIDWIFE", "DOCTOR", "SUPERVISOR", "ADMIN"];

const router = Router();

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPatients:
 *                       type: integer
 *                       description: Total number of registered patients
 *                     activePregnancies:
 *                       type: integer
 *                       description: Number of active pregnancies
 *                     highRiskCount:
 *                       type: integer
 *                       description: Number of high-risk patients
 *                     appointmentsToday:
 *                       type: integer
 *                       description: Number of appointments scheduled for today
 *                     totalVisits:
 *                       type: integer
 *                       description: Total number of visits
 *                     upcomingAppointments:
 *                       type: integer
 *                       description: Number of appointments in the next 7 days
 *                     patientsWithReferrals:
 *                       type: integer
 *                       description: Number of patients with referrals
 *                     totalDeliveries:
 *                       type: integer
 *                       description: Total number of deliveries
 *                     totalPNCVisits:
 *                       type: integer
 *                       description: Total number of PNC visits
 *                     totalGBVCases:
 *                       type: integer
 *                       description: Total number of GBV cases
 *                     patientsThisMonth:
 *                       type: integer
 *                       description: Number of patients registered this month
 *                     visitsThisMonth:
 *                       type: integer
 *                       description: Number of visits this month
 */
router.get(
  "/dashboard",
  authenticate,
  authorizeRoles(...ALLOWED),
  AnalyticsController.getDashboardStats
);

/**
 * @swagger
 * /api/v1/analytics/appointments/today:
 *   get:
 *     summary: Get today's appointments with details
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 appointments:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  "/appointments/today",
  authenticate,
  authorizeRoles(...ALLOWED),
  AnalyticsController.getAppointmentsToday
);

/**
 * @swagger
 * /api/v1/analytics/high-risk:
 *   get:
 *     summary: Get high-risk patients with details
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: High-risk patients list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 patients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       patient:
 *                         type: object
 *                       riskFactors:
 *                         type: array
 *                         items:
 *                           type: string
 */
router.get(
  "/high-risk",
  authenticate,
  authorizeRoles(...ALLOWED),
  AnalyticsController.getHighRiskPatients
);

/** UNFPA DMP analytics (overview, dashboard-stats, visits-by-month, …) — API-REFERENCE.md */
router.use("/", analyticsRefRouter);

export default router;
