import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError, parsePagination, meta } from "./helpers";
import { z } from "zod";

const router = Router();

const createClinic = z.object({
  name: z.string(),
  location: z.string(),
  region: z.string(),
  zone: z.string(),
  woreda: z.string(),
  type: z.enum(["fixed", "mobile"]),
  staffIds: z.array(z.string().uuid()).optional(),
});

const updateClinic = createClinic.partial().extend({
  status: z.enum(["active", "inactive"]).optional(),
});

/**
 * @swagger
 * /api/v1/clinics:
 *   get:
 *     summary: List clinics (filters in query)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: region
 *         schema: { type: string }
 *       - in: query
 *         name: zone
 *         schema: { type: string }
 *       - in: query
 *         name: woreda
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [fixed, mobile] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
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
      if (req.query.region) where.region = String(req.query.region);
      if (req.query.zone) where.zone = String(req.query.zone);
      if (req.query.woreda) where.woreda = String(req.query.woreda);
      if (req.query.type) where.type = String(req.query.type);
      if (req.query.status) where.status = String(req.query.status);

      const [total, rows] = await Promise.all([
        db.clinic.count({ where }),
        db.clinic.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
          include: {
            users: { include: { roles: { include: { role: true } } } },
          },
        }),
      ]);

      const data = rows.map((c: any) => ({
        id: c.id,
        name: c.name,
        location: c.location,
        region: c.region,
        zone: c.zone,
        woreda: c.woreda,
        type: c.type.toLowerCase(),
        status: c.status.toLowerCase(),
        staff: c.users.map((u: any) => ({
          id: u.id,
          name: u.fullName ?? u.phone,
          email: u.email ?? `${u.phone}@phone.local`,
          role: "midwife",
          lastActive: u.updatedAt.toISOString(),
          status: "offline",
          createdAt: u.createdAt.toISOString(),
        })),
        patientCount: c.patientCount,
        lastSync: c.lastSync?.toISOString() ?? new Date().toISOString(),
        createdAt: c.createdAt.toISOString(),
      }));

      sendData(res, data, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/clinics/{id}/stats:
 *   get:
 *     summary: Per-clinic statistics (DMP dashboard cards)
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
 *         description: "{ data: DashboardStatsResponse }"
 */
router.get(
  "/:id/stats",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const c = await db.clinic.findUnique({ where: { id: req.params.id } });
      if (!c) return sendError(res, "NOT_FOUND", "Clinic not found", 404);
      sendData(res, {
        totalPatients: c.patientCount,
        activePregnancies: 0,
        highRiskPatients: 0,
        visitsThisMonth: 0,
        teleconsultsThisMonth: 0,
        gbvReportsThisMonth: 0,
        syncPendingCount: 0,
        appointmentsToday: 0,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/clinics/{id}:
 *   get:
 *     summary: Get clinic by id
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
 *         description: "{ data: ClinicResponse }"
 */
router.get(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const c = await db.clinic.findUnique({
        where: { id: req.params.id },
        include: { users: { include: { roles: { include: { role: true } } } } },
      });
      if (!c) return sendError(res, "NOT_FOUND", "Clinic not found", 404);
      sendData(res, {
        id: c.id,
        name: c.name,
        location: c.location,
        region: c.region,
        zone: c.zone,
        woreda: c.woreda,
        type: c.type.toLowerCase(),
        status: c.status.toLowerCase(),
        staff: c.users.map((u: any) => ({
          id: u.id,
          name: u.fullName ?? u.phone,
          email: u.email ?? `${u.phone}@phone.local`,
          role: "midwife",
          lastActive: u.updatedAt.toISOString(),
          status: "offline",
          createdAt: u.createdAt.toISOString(),
        })),
        patientCount: c.patientCount,
        lastSync: c.lastSync?.toISOString() ?? new Date().toISOString(),
        createdAt: c.createdAt.toISOString(),
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/clinics:
 *   post:
 *     summary: Create clinic (admin)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location, region, zone, woreda, type]
 *             properties:
 *               name: { type: string }
 *               location: { type: string }
 *               region: { type: string }
 *               zone: { type: string }
 *               woreda: { type: string }
 *               type: { type: string, enum: [fixed, mobile] }
 *               staffIds: { type: array, items: { type: string, format: uuid } }
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
      const parsed = createClinic.parse(req.body);
      const clinic = await db.clinic.create({
        data: {
          name: parsed.name,
          location: parsed.location,
          region: parsed.region,
          zone: parsed.zone,
          woreda: parsed.woreda,
          type: parsed.type === "fixed" ? "fixed" : "mobile",
          status: "active",
        },
      });
      sendData(res, { id: clinic.id, ...parsed, status: "active", patientCount: 0 }, 201);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/clinics/{id}:
 *   patch:
 *     summary: Update clinic (admin)
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = updateClinic.parse(req.body);
      const clinic = await db.clinic.update({
        where: { id: req.params.id },
        data: {
          name: parsed.name,
          location: parsed.location,
          region: parsed.region,
          zone: parsed.zone,
          woreda: parsed.woreda,
          type: parsed.type === "fixed" ? "fixed" : parsed.type === "mobile" ? "mobile" : undefined,
          status: parsed.status === "active" ? "active" : parsed.status === "inactive" ? "inactive" : undefined,
        },
      });
      sendData(res, clinic);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/clinics/{id}:
 *   delete:
 *     summary: Deactivate clinic (admin)
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
      await db.clinic.update({
        where: { id: req.params.id },
        data: { status: "inactive" },
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
