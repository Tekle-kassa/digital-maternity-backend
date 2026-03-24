import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError, parsePagination, meta } from "./helpers";
import { mapGbvToApi } from "./mappers";
import { GBVService } from "../gbv/gbv.service";
import { ultrasoundUpload } from "../common/multerS3";
import { z } from "zod";

const router = Router();

/**
 * @swagger
 * /api/v1/gbv-reports:
 *   get:
 *     summary: List GBV reports
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
  authorizeRoles("MIDWIFE", "DOCTOR", "GBV_OFFICER", "ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
      const where: Record<string, unknown> = {};
      if (req.query.patientId) where.patientId = String(req.query.patientId);

      const total = await db.gBVReport.count({ where });
      const rows = await db.gBVReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { patient: true, recordedBy: true },
      });
      sendData(
        res,
        rows.map((r: any) =>
          mapGbvToApi(r, r.patient.fullName, r.recordedBy.fullName ?? r.recordedBy.phone)
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
 * /api/v1/gbv-reports/{id}:
 *   get:
 *     summary: GBV report by id
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
  authorizeRoles("MIDWIFE", "DOCTOR", "GBV_OFFICER", "ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const r = await db.gBVReport.findUnique({
        where: { id: req.params.id },
        include: { patient: true, recordedBy: true },
      });
      if (!r) return sendError(res, "NOT_FOUND", "Report not found", 404);
      sendData(res, mapGbvToApi(r, r.patient.fullName, r.recordedBy.fullName ?? r.recordedBy.phone));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/gbv-reports:
 *   post:
 *     summary: Create GBV report (optional multipart attachments field)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [patientId]
 *             properties:
 *               attachments:
 *                 type: string
 *                 format: binary
 *               patientId: { type: string, format: uuid }
 *               incidentDate: { type: string }
 *               incidentType: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("MIDWIFE", "DOCTOR", "GBV_OFFICER"),
  ultrasoundUpload.single("attachments"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
      const parsed = z
        .object({
          patientId: z.string().uuid(),
          incidentDate: z.string().optional(),
          incidentType: z.string().optional(),
          description: z.string().optional(),
        })
        .parse(req.body);
      const attachmentUrl = file
        ? (file as Express.Multer.File & { location?: string }).location
        : undefined;
      const { id: newId } = await GBVService.createGBV({
        patientId: parsed.patientId,
        recordedById: req.user!.id,
        incidentDate: parsed.incidentDate,
        allegedPerpetrator: undefined,
        victimStatement: parsed.description,
        referralAction: undefined,
        referral: false,
        referralInfo: undefined,
        attachmentUrl,
        highRisk: false,
      });
      const r = await db.gBVReport.findUnique({
        where: { id: newId },
        include: { patient: true, recordedBy: true },
      });
      if (!r) return sendError(res, "ERROR", "Create failed", 500);
      sendData(
        res,
        mapGbvToApi(r, r.patient.fullName, r.recordedBy.fullName ?? r.recordedBy.phone),
        201
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/gbv-reports/{id}:
 *   patch:
 *     summary: Update GBV report
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
 *         description: Updated
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("MIDWIFE", "DOCTOR", "GBV_OFFICER"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await GBVService.updateGBV(req.params.id, req.user!.id, req.body);
      const r = await db.gBVReport.findUnique({
        where: { id: req.params.id },
        include: { patient: true, recordedBy: true },
      });
      if (!r) return sendError(res, "NOT_FOUND", "Report not found", 404);
      sendData(res, mapGbvToApi(r, r.patient.fullName, r.recordedBy.fullName ?? r.recordedBy.phone));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/gbv-reports/{id}:
 *   delete:
 *     summary: Delete GBV report (admin)
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
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await GBVService.deleteGBV(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
