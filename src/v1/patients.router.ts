import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError, parsePagination, meta } from "./helpers";
import { mapPatientToApi, mapVisitToApi, mapUltrasoundToApi, mapGbvToApi } from "./mappers";
import { PatientRepository } from "../patient/patient.repository";
import { PatientService } from "../patient/pateint.service";
import { z } from "zod";

const router = Router();

const createPatient = z.object({
  fullName: z.string(),
  dateOfBirth: z.string().optional(),
  idNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  village: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  pregnancyStatus: z.enum(["pregnant", "postpartum", "not_pregnant"]).optional(),
  gravida: z.number().optional(),
  para: z.number().optional(),
  assignedMidwifeId: z.string().uuid().optional(),
  clinicId: z.string().uuid().optional(),
});

/**
 * @swagger
 * /api/v1/patients:
 *   get:
 *     summary: List patients (paginated, DMP envelope)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: "{ data, meta } — PatientResponse[]"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 */
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
      const total = await db.patient.count();
      const rows = await db.patient.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      sendData(
        res,
        rows.map((p: any) => mapPatientToApi(p)),
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
 * /api/v1/patients/{id}/visits:
 *   get:
 *     summary: Patient prenatal visits
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
 *         description: "{ data: PrenatalVisitResponse[] }"
 */
router.get(
  "/:id/visits",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const visits = await db.visit.findMany({
        where: { patientId: req.params.id },
        orderBy: { visitDate: "desc" },
        include: { patient: true, recordedBy: true },
      });
      sendData(
        res,
        visits.map((v: any) =>
          mapVisitToApi(v, v.patient.fullName, v.recordedBy.fullName ?? v.recordedBy.phone)
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/patients/{id}/ultrasounds:
 *   get:
 *     summary: Patient ultrasound records
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
 *         description: "{ data: UltrasoundResponse[] }"
 */
router.get(
  "/:id/ultrasounds",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const list = await db.ultrasound.findMany({
        where: { patientId: req.params.id },
        include: { patient: true, takenBy: true },
      });
      sendData(
        res,
        list.map((u: any) =>
          mapUltrasoundToApi(u, u.patient.fullName, u.takenBy.fullName ?? u.takenBy.phone)
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/patients/{id}/teleconsults:
 *   get:
 *     summary: Patient teleconsult requests
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
 *         description: "{ data: TeleconsultResponse[] }"
 */
router.get(
  "/:id/teleconsults",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const list = await db.teleconsultRequest.findMany({
        where: { patientId: req.params.id },
        include: { patient: true, requestedBy: true, response: true },
      });
      sendData(
        res,
        list.map((t: any) => ({
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
          status: t.status.toLowerCase(),
          syncStatus: t.syncStatus.toLowerCase(),
          createdAt: t.createdAt.toISOString(),
        }))
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/patients/{id}/gbv-reports:
 *   get:
 *     summary: Patient GBV reports (restricted roles)
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
 *         description: "{ data: GBVReportResponse[] }"
 */
router.get(
  "/:id/gbv-reports",
  authenticate,
  authorizeRoles("MIDWIFE", "DOCTOR", "GBV_OFFICER", "ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const list = await db.gBVReport.findMany({
        where: { patientId: req.params.id },
        include: { patient: true, recordedBy: true },
      });
      sendData(
        res,
        list.map((r: any) =>
          mapGbvToApi(r, r.patient.fullName, r.recordedBy.fullName ?? r.recordedBy.phone)
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/patients/{id}/alerts:
 *   get:
 *     summary: Alerts related to patient
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
 *         description: "{ data: AlertResponse[] }"
 */
router.get(
  "/:id/alerts",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const list = await db.userAlert.findMany({
        where: { patientId: req.params.id },
      });
      sendData(
        res,
        list.map((a: any) => ({
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
        }))
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   get:
 *     summary: Get patient by id
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
 *         description: "{ data: PatientResponse }"
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const p = await PatientRepository.findById(req.params.id);
      if (!p) return sendError(res, "NOT_FOUND", "Patient not found", 404);
      sendData(res, mapPatientToApi(p));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/patients:
 *   post:
 *     summary: Register new patient (DMP)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName]
 *             properties:
 *               fullName: { type: string }
 *               phoneNumber: { type: string }
 *               address: { type: string }
 *               village: { type: string }
 *               emergencyContact: { type: string }
 *               emergencyPhone: { type: string }
 *               idNumber: { type: string }
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
      const parsed = createPatient.parse(req.body);
      const unfpId = `UNFPA-${Date.now()}`;
      const patient = await PatientRepository.create(
        {
          fullName: parsed.fullName,
          phone: parsed.phoneNumber,
          address: parsed.address,
          woreda: parsed.village,
          emergencyContact: parsed.emergencyContact,
          emergencyPhone: parsed.emergencyPhone,
          idNumber: parsed.idNumber,
          createdById: req.user!.id,
        },
        unfpId
      );
      sendData(res, mapPatientToApi(patient), 201);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   patch:
 *     summary: Update patient
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
  authorizeRoles("MIDWIFE", "NURSE", "DOCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const patient = await PatientService.updatePatient(req.params.id, req.body);
      sendData(res, mapPatientToApi(patient));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   delete:
 *     summary: Delete patient (admin)
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
      await db.patient.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
