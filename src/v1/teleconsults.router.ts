import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError, parsePagination, meta } from "./helpers";
import { z } from "zod";

const router = Router();

const createTc = z.object({
  patientId: z.string().uuid(),
  priority: z.enum(["routine", "urgent", "emergency"]),
  consultationType: z.enum([
    "general",
    "high_risk",
    "ultrasound_review",
    "gbv",
    "complication",
  ]),
  chiefComplaint: z.string(),
  clinicalNotes: z.string().optional(),
});

/**
 * @swagger
 * /api/v1/teleconsults:
 *   get:
 *     summary: List teleconsult requests
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema: { type: string, format: uuid }
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
      const where: Record<string, unknown> = {};
      if (req.query.patientId) where.patientId = String(req.query.patientId);

      const total = await db.teleconsultRequest.count({ where });
      const rows = await db.teleconsultRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { patient: true, requestedBy: true, assignedSpecialist: true, response: true },
      });
      sendData(
        res,
        rows.map((t: any) => ({
          id: t.id,
          patientId: t.patientId,
          patientName: t.patient.fullName,
          requestedBy: t.requestedBy.fullName ?? t.requestedBy.phone,
          requestedById: t.requestedById,
          requestDate: t.requestDate.toISOString(),
          priority: t.priority.toLowerCase(),
          consultationType: t.consultationType.toLowerCase(),
          chiefComplaint: t.chiefComplaint,
          clinicalNotes: t.clinicalNotes,
          attachments: [] as { id: string; type: string; url: string; name: string }[],
          assignedSpecialist: t.assignedSpecialist?.fullName ?? undefined,
          assignedSpecialistId: t.assignedSpecialistId ?? undefined,
          status: t.status.toLowerCase(),
          response: t.response
            ? {
                respondedBy: "",
                respondedById: t.response.respondedById,
                respondedAt: t.response.respondedAt.toISOString(),
                diagnosis: t.response.diagnosis ?? undefined,
                recommendations: t.response.recommendations,
                followUpInstructions: t.response.followUpInstructions,
                prescriptions: t.response.prescriptions,
              }
            : undefined,
          syncStatus: t.syncStatus.toLowerCase(),
          createdAt: t.createdAt.toISOString(),
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
 * /api/v1/teleconsults/{id}:
 *   get:
 *     summary: Teleconsult by id
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
      const t = await db.teleconsultRequest.findUnique({
        where: { id: req.params.id },
        include: { patient: true, requestedBy: true, assignedSpecialist: true, response: true },
      });
      if (!t) return sendError(res, "NOT_FOUND", "Not found", 404);
      sendData(res, {
        id: t.id,
        patientId: t.patientId,
        patientName: t.patient.fullName,
        requestedBy: t.requestedBy.fullName ?? t.requestedBy.phone,
        requestedById: t.requestedById,
        requestDate: t.requestDate.toISOString(),
        priority: t.priority.toLowerCase(),
        consultationType: t.consultationType.toLowerCase(),
        chiefComplaint: t.chiefComplaint,
        clinicalNotes: t.clinicalNotes,
        attachments: [],
        assignedSpecialist: t.assignedSpecialist?.fullName,
        assignedSpecialistId: t.assignedSpecialistId ?? undefined,
        status: t.status.toLowerCase(),
        syncStatus: t.syncStatus.toLowerCase(),
        createdAt: t.createdAt.toISOString(),
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/teleconsults:
 *   post:
 *     summary: Create teleconsult request
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, priority, consultationType, chiefComplaint]
 *     responses:
 *       201:
 *         description: "Created (id, status)"
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("MIDWIFE", "NURSE", "DOCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = createTc.parse(req.body);
      const t = await db.teleconsultRequest.create({
        data: {
          patientId: parsed.patientId,
          requestedById: req.user!.id,
          priority: parsed.priority,
          consultationType: parsed.consultationType,
          chiefComplaint: parsed.chiefComplaint,
          clinicalNotes: parsed.clinicalNotes ?? "",
        },
        include: { patient: true, requestedBy: true },
      });
      sendData(res, { id: t.id, status: t.status.toLowerCase() }, 201);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/teleconsults/{id}:
 *   patch:
 *     summary: Update teleconsult (assign, status, notes)
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
 *         description: "{ id, status }"
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("DOCTOR", "ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          priority: z.enum(["routine", "urgent", "emergency"]).optional(),
          assignedSpecialistId: z.string().uuid().nullable().optional(),
          status: z
            .enum(["pending", "assigned", "in_review", "responded", "closed"])
            .optional(),
          clinicalNotes: z.string().optional(),
        })
        .parse(req.body);
      const t = await db.teleconsultRequest.update({
        where: { id: req.params.id },
        data: {
          priority: body.priority,
          assignedSpecialistId: body.assignedSpecialistId ?? undefined,
          status: body.status,
          clinicalNotes: body.clinicalNotes,
        },
      });
      sendData(res, { id: t.id, status: t.status.toLowerCase() });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/teleconsults/{id}/respond:
 *   post:
 *     summary: Submit specialist response (upsert)
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
 *             required: [recommendations, followUpInstructions]
 *     responses:
 *       200:
 *         description: "{ ok: true }"
 */
router.post(
  "/:id/respond",
  authenticate,
  authorizeRoles("DOCTOR", "MIDWIFE"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          diagnosis: z.string().optional(),
          recommendations: z.string(),
          followUpInstructions: z.string(),
          prescriptions: z.array(z.string()).optional(),
        })
        .parse(req.body);
      const tc = await db.teleconsultRequest.findUnique({ where: { id: req.params.id } });
      if (!tc) return sendError(res, "NOT_FOUND", "Not found", 404);

      await db.teleconsultResponse.upsert({
        where: { teleconsultId: tc.id },
        create: {
          teleconsultId: tc.id,
          respondedById: req.user!.id,
          diagnosis: body.diagnosis,
          recommendations: body.recommendations,
          followUpInstructions: body.followUpInstructions,
          prescriptions: body.prescriptions ?? [],
        },
        update: {
          respondedById: req.user!.id,
          diagnosis: body.diagnosis,
          recommendations: body.recommendations,
          followUpInstructions: body.followUpInstructions,
          prescriptions: body.prescriptions ?? [],
        },
      });
      await db.teleconsultRequest.update({
        where: { id: tc.id },
        data: { status: "responded" },
      });
      sendData(res, { ok: true });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/teleconsults/{id}:
 *   delete:
 *     summary: Delete teleconsult (requester or admin)
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
      const tc = await db.teleconsultRequest.findUnique({ where: { id: req.params.id } });
      if (!tc) return sendError(res, "NOT_FOUND", "Not found", 404);
      if (tc.requestedById !== req.user!.id) {
        const roles = req.user!.roles ?? [];
        if (!roles.includes("ADMIN")) return sendError(res, "FORBIDDEN", "Forbidden", 403);
      }
      await db.teleconsultRequest.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
