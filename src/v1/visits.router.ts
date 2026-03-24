import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError, parsePagination, meta } from "./helpers";
import { mapVisitToApi } from "./mappers";
import { VisitService } from "../visit/visit.service";
import { z } from "zod";

const router = Router();

const createVisit = z.object({
  patientId: z.string().uuid(),
  visitDate: z.string(),
  gestationalAge: z.object({ weeks: z.number(), days: z.number() }),
  vitals: z.object({
    bloodPressureSystolic: z.number(),
    bloodPressureDiastolic: z.number(),
    weight: z.number(),
    temperature: z.number(),
    pulse: z.number(),
    respiratoryRate: z.number(),
  }),
  symptoms: z.array(z.string()),
  medications: z.array(z.string()).optional(),
  notes: z.string().optional(),
  riskFlags: z.array(z.string()).optional(),
});

/**
 * @swagger
 * /api/v1/visits:
 *   get:
 *     summary: List prenatal visits
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: conductedById
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "{ data, meta } — PrenatalVisitResponse"
 */
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
      const where: Record<string, unknown> = {};
      if (req.query.patientId) where.patientId = String(req.query.patientId);
      if (req.query.conductedById) where.recordedById = String(req.query.conductedById);

      const total = await db.visit.count({ where });
      const visits = await db.visit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { visitDate: "desc" },
        include: { patient: true, recordedBy: true },
      });
      sendData(
        res,
        visits.map((v: any) =>
          mapVisitToApi(v, v.patient.fullName, v.recordedBy.fullName ?? v.recordedBy.phone)
        ),
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
 * /api/v1/visits/{id}:
 *   get:
 *     summary: Visit by id
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: "{ data: PrenatalVisitResponse }"
 */
router.get(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const v = await db.visit.findUnique({
        where: { id: req.params.id },
        include: { patient: true, recordedBy: true },
      });
      if (!v) return sendError(res, "NOT_FOUND", "Visit not found", 404);
      sendData(res, mapVisitToApi(v, v.patient.fullName, v.recordedBy.fullName ?? v.recordedBy.phone));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/visits:
 *   post:
 *     summary: Record new visit (CreateVisitRequest)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, visitDate, gestationalAge, vitals, symptoms]
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("MIDWIFE", "NURSE", "DOCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = createVisit.parse(req.body);
      const bp = `${parsed.vitals.bloodPressureSystolic}/${parsed.vitals.bloodPressureDiastolic}`;
      const visit = await db.visit.create({
        data: {
          patientId: parsed.patientId,
          recordedById: req.user!.id,
          visitDate: new Date(parsed.visitDate),
          gestationalAge: parsed.gestationalAge.weeks,
          bloodPressure: bp,
          temperature: parsed.vitals.temperature,
          weight: parsed.vitals.weight,
          symptoms: parsed.symptoms.join(", "),
          notes: parsed.notes ?? "",
        },
        include: { patient: true, recordedBy: true },
      });
      sendData(
        res,
        mapVisitToApi(visit, visit.patient.fullName, visit.recordedBy.fullName ?? visit.recordedBy.phone),
        201
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/visits/{id}:
 *   patch:
 *     summary: Update visit
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("MIDWIFE", "NURSE", "DOCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Record<string, unknown>;
      const updated = await VisitService.updateVisit(req.params.id, body as Partial<import("../visit/visit.repository").CreateVisitDTO>);
      const v = await db.visit.findUnique({
        where: { id: updated.id },
        include: { patient: true, recordedBy: true },
      });
      if (!v) return sendError(res, "NOT_FOUND", "Visit not found", 404);
      sendData(res, mapVisitToApi(v, v.patient.fullName, v.recordedBy.fullName ?? v.recordedBy.phone));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/visits/{id}:
 *   delete:
 *     summary: Delete visit (admin)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: No content
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await VisitService.deleteVisit(req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
