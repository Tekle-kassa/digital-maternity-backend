import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError, parsePagination, meta } from "./helpers";
import { mapUltrasoundToApi } from "./mappers";
import { UltrasoundService } from "../ultrsound/ultrasound.service";
import { memoryUpload } from "../common/multerMemory";
import { isCloudinaryConfigured, uploadUltrasoundImage } from "../common/cloudinaryUpload";
import { z } from "zod";

const router = Router();

/**
 * @swagger
 * /api/v1/ultrasounds:
 *   get:
 *     summary: List ultrasounds
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: capturedById
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
      if (req.query.capturedById) where.takenById = String(req.query.capturedById);

      const total = await db.ultrasound.count({ where });
      const rows = await db.ultrasound.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { patient: true, takenBy: true },
      });
      sendData(
        res,
        rows.map((u: any) =>
          mapUltrasoundToApi(u, u.patient.fullName, u.takenBy.fullName ?? u.takenBy.phone)
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
 * /api/v1/ultrasounds/{id}:
 *   get:
 *     summary: Ultrasound by id
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
      const u = await db.ultrasound.findUnique({
        where: { id: req.params.id },
        include: { patient: true, takenBy: true },
      });
      if (!u) return sendError(res, "NOT_FOUND", "Ultrasound not found", 404);
      sendData(res, mapUltrasoundToApi(u, u.patient.fullName, u.takenBy.fullName ?? u.takenBy.phone));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/ultrasounds:
 *   post:
 *     summary: Upload ultrasound image (multipart image field plus JSON fields)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image, patientId]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               patientId: { type: string, format: uuid }
 *               visitId: { type: string, format: uuid }
 *               captureDate: { type: string }
 *               gestationalAge: { type: string }
 *               findings: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("MIDWIFE", "NURSE", "DOCTOR"),
  memoryUpload.single("image"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!isCloudinaryConfigured()) {
        return sendError(
          res,
          "NOT_CONFIGURED",
          "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
          503
        );
      }
      const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
      if (!file?.buffer) return sendError(res, "VALIDATION_ERROR", "image file required", 400);
      const body = z
        .object({
          patientId: z.string().uuid(),
          visitId: z.string().uuid().optional(),
          captureDate: z.string().optional(),
          gestationalAge: z.string().optional(),
          findings: z.string().optional(),
        })
        .parse({
          ...req.body,
          gestationalAge: req.body.gestationalAge,
        });
      const imageUrl = await uploadUltrasoundImage(file.buffer, file.mimetype);
      const ga = body.gestationalAge ? parseInt(String(body.gestationalAge), 10) : undefined;
      const created = await UltrasoundService.createUltrasound({
        patientId: body.patientId,
        visitId: body.visitId,
        takenById: req.user!.id,
        imageUrl,
        description: body.findings,
        gestationalAge: ga,
      });
      const u = await db.ultrasound.findUnique({
        where: { id: created.id },
        include: { patient: true, takenBy: true },
      });
      if (!u) return sendError(res, "ERROR", "Create failed", 500);
      sendData(
        res,
        mapUltrasoundToApi(u, u.patient.fullName, u.takenBy.fullName ?? u.takenBy.phone),
        201
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/ultrasounds/{id}:
 *   patch:
 *     summary: Update ultrasound metadata
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
  authorizeRoles("MIDWIFE", "DOCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await UltrasoundService.updateUltrasound(req.params.id, req.body);
      const u = await db.ultrasound.findUnique({
        where: { id: req.params.id },
        include: { patient: true, takenBy: true },
      });
      if (!u) return sendError(res, "NOT_FOUND", "Ultrasound not found", 404);
      sendData(res, mapUltrasoundToApi(u, u.patient.fullName, u.takenBy.fullName ?? u.takenBy.phone));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/ultrasounds/{id}:
 *   delete:
 *     summary: Delete ultrasound (admin)
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
      await UltrasoundService.deleteUltrasound(req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
