import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError } from "./helpers";
import { mapPatientToApi } from "./mappers";
import { AnalyticsRepository } from "../analytics/analytics.repository";
import { z } from "zod";

const router = Router();

/**
 * @swagger
 * /api/v1/risk/patients:
 *   get:
 *     summary: High-risk patients (mapped to DMP patient shape)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: array }"
 */
router.get(
  "/patients",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const details = await AnalyticsRepository.getHighRiskPatientsDetails();
      sendData(
        res,
        details.map((d: { patient: { id: string; fullName: string; phone: string | null; age: number | null; address: string | null; woreda: string | null; emergencyContact: string | null; emergencyPhone: string | null; createdAt: Date; unfpId: string } }) =>
          mapPatientToApi(d.patient)
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/risk/rules:
 *   get:
 *     summary: Active risk rules
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: array }"
 */
router.get(
  "/rules",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rules = await db.riskRule.findMany({ where: { isActive: true } });
      sendData(
        res,
        rules.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          condition: r.condition,
          weight: r.weight,
          version: r.version,
          isActive: r.isActive,
        }))
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/risk/rules:
 *   post:
 *     summary: Create risk rule (admin)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, condition, weight]
 *     responses:
 *       201:
 *         description: "Created (id)"
 */
router.post(
  "/rules",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          name: z.string(),
          description: z.string(),
          condition: z.string(),
          weight: z.number().int(),
        })
        .parse(req.body);
      const r = await db.riskRule.create({ data: body });
      sendData(res, { id: r.id }, 201);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/risk/rules/{id}:
 *   patch:
 *     summary: Update risk rule (admin)
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
 *         description: "{ id }"
 */
router.patch(
  "/rules/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          name: z.string().optional(),
          description: z.string().optional(),
          condition: z.string().optional(),
          weight: z.number().optional(),
          isActive: z.boolean().optional(),
        })
        .parse(req.body);
      const r = await db.riskRule.update({ where: { id: req.params.id }, data: body });
      sendData(res, { id: r.id });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/risk/rules/{id}:
 *   delete:
 *     summary: Deactivate risk rule (admin)
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
  "/rules/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await db.riskRule.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/risk/calculate/{patientId}:
 *   post:
 *     summary: Recalculate risk score (placeholder response)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: "{ data }"
 */
router.post(
  "/calculate/:patientId",
  authenticate,
  authorizeRoles("DOCTOR", "ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const p = await db.patient.findUnique({ where: { id: req.params.patientId } });
      if (!p) return sendError(res, "NOT_FOUND", "Patient not found", 404);
      sendData(res, {
        patientId: p.id,
        previousScore: 0,
        newScore: 0,
        riskLevel: "low",
        matchedRules: [] as { ruleId: string; ruleName: string; weight: number }[],
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
