import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError, parsePagination, meta } from "./helpers";
import { z } from "zod";

const router = Router();

const createAppt = z.object({
  patientId: z.string().uuid(),
  type: z.enum(["prenatal_checkup", "ultrasound", "lab_test", "follow_up", "teleconsult"]),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  clinicId: z.string().uuid(),
  midwifeId: z.string().uuid(),
  priority: z.enum(["routine", "urgent", "emergency"]),
  notes: z.string().optional(),
});

/**
 * @swagger
 * /api/v1/appointments/today:
 *   get:
 *     summary: Appointments scheduled for today
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: array }"
 */
router.get(
  "/today",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const rows = await db.appointment.findMany({
        where: { scheduledDate: { gte: start, lt: end } },
        include: { patient: true, clinic: true, midwife: true },
      });
      sendData(
        res,
        rows.map((a: any) => ({
          id: a.id,
          patientId: a.patientId,
          patientName: a.patient.fullName,
          type: a.type.toLowerCase(),
          scheduledDate: a.scheduledDate.toISOString().slice(0, 10),
          scheduledTime: a.scheduledTime,
          clinicId: a.clinicId,
          clinicName: a.clinic.name,
          midwifeId: a.midwifeId,
          midwifeName: a.midwife.fullName ?? a.midwife.phone,
          priority: a.priority.toLowerCase(),
          status: a.status.toLowerCase(),
          notes: a.notes ?? undefined,
          createdAt: a.createdAt.toISOString(),
        }))
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/appointments:
 *   get:
 *     summary: List appointments
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: clinicId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: midwifeId
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
      if (req.query.clinicId) where.clinicId = String(req.query.clinicId);
      if (req.query.midwifeId) where.midwifeId = String(req.query.midwifeId);

      const total = await db.appointment.count({ where });
      const rows = await db.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: "asc" },
        include: { patient: true, clinic: true, midwife: true },
      });
      sendData(
        res,
        rows.map((a: any) => ({
          id: a.id,
          patientId: a.patientId,
          patientName: a.patient.fullName,
          type: a.type.toLowerCase(),
          scheduledDate: a.scheduledDate.toISOString().slice(0, 10),
          scheduledTime: a.scheduledTime,
          clinicId: a.clinicId,
          clinicName: a.clinic.name,
          midwifeId: a.midwifeId,
          midwifeName: a.midwife.fullName ?? a.midwife.phone,
          priority: a.priority.toLowerCase(),
          status: a.status.toLowerCase(),
          notes: a.notes ?? undefined,
          createdAt: a.createdAt.toISOString(),
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
 * /api/v1/appointments/{id}:
 *   get:
 *     summary: Appointment by id
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
      const a = await db.appointment.findUnique({
        where: { id: req.params.id },
        include: { patient: true, clinic: true, midwife: true },
      });
      if (!a) return sendError(res, "NOT_FOUND", "Not found", 404);
      sendData(res, {
        id: a.id,
        patientId: a.patientId,
        patientName: a.patient.fullName,
        type: a.type.toLowerCase(),
        scheduledDate: a.scheduledDate.toISOString().slice(0, 10),
        scheduledTime: a.scheduledTime,
        clinicId: a.clinicId,
        clinicName: a.clinic.name,
        midwifeId: a.midwifeId,
        midwifeName: a.midwife.fullName ?? a.midwife.phone,
        priority: a.priority.toLowerCase(),
        status: a.status.toLowerCase(),
        notes: a.notes ?? undefined,
        createdAt: a.createdAt.toISOString(),
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/appointments:
 *   post:
 *     summary: Create appointment
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, type, scheduledDate, scheduledTime, clinicId, midwifeId, priority]
 *     responses:
 *       201:
 *         description: "Created (id)"
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("MIDWIFE", "NURSE", "DOCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = createAppt.parse(req.body);
      const a = await db.appointment.create({
        data: {
          patientId: parsed.patientId,
          type: parsed.type,
          scheduledDate: new Date(parsed.scheduledDate),
          scheduledTime: parsed.scheduledTime,
          clinicId: parsed.clinicId,
          midwifeId: parsed.midwifeId,
          priority: parsed.priority,
          notes: parsed.notes,
        },
        include: { patient: true, clinic: true, midwife: true },
      });
      sendData(res, { id: a.id }, 201);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   patch:
 *     summary: Update appointment
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
  authorizeRoles("MIDWIFE", "NURSE", "DOCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          scheduledDate: z.string().optional(),
          scheduledTime: z.string().optional(),
          status: z
            .enum([
              "scheduled",
              "confirmed",
              "in_progress",
              "completed",
              "missed",
              "cancelled",
            ])
            .optional(),
          notes: z.string().optional(),
        })
        .parse(req.body);
      const a = await db.appointment.update({
        where: { id: req.params.id },
        data: {
          scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
          scheduledTime: body.scheduledTime,
          status: body.status,
          notes: body.notes,
        },
      });
      sendData(res, { id: a.id, status: a.status.toLowerCase() });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   delete:
 *     summary: Cancel appointment (sets status cancelled)
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
      await db.appointment.update({
        where: { id: req.params.id },
        data: { status: "cancelled" },
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
