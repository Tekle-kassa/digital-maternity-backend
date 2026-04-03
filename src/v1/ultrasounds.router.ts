import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError, parsePagination, meta } from "./helpers";
import { mapUltrasoundToApi } from "./mappers";
import { UltrasoundService } from "../ultrsound/ultrasound.service";
import { memoryUploadUltrasound } from "../common/multerMemory";
import {
  isS3UploadConfigured,
  uploadUltrasoundMedia,
} from "../common/s3Upload";
import { parseUltrasoundMultipartFields } from "../ultrsound/ultrasound.validators";
import { AppError } from "../utils/AppError";

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
        include: {
          patient: true,
          takenBy: true,
          visit: { select: { id: true, visitCaseCategory: true } },
        },
      });
      sendData(
        res,
        rows.map((u: any) =>
          mapUltrasoundToApi(
            u,
            u.patient.fullName,
            u.takenBy.fullName ?? u.takenBy.phone,
            u.visit
          )
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
        include: {
          patient: true,
          takenBy: true,
          visit: { select: { id: true, visitCaseCategory: true } },
        },
      });
      if (!u) return sendError(res, "NOT_FOUND", "Ultrasound not found", 404);
      sendData(
        res,
        mapUltrasoundToApi(
          u,
          u.patient.fullName,
          u.takenBy.fullName ?? u.takenBy.phone,
          u.visit
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/ultrasounds:
 *   post:
 *     summary: Upload ultrasound image or video (multipart)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, timestamp, visitId]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image or video (field name file; image accepted for backward compatibility)
 *               timestamp:
 *                 type: string
 *                 description: ISO 8601 UTC capture time
 *                 example: 2026-03-29T08:15:30.123Z
 *               visitId:
 *                 type: string
 *                 format: uuid
 *               gain:
 *                 type: string
 *                 description: Integer as string (optional)
 *               depth:
 *                 type: string
 *               dynamicRange:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *                 deprecated: true
 *               patientId:
 *                 type: string
 *                 deprecated: true
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
  memoryUploadUltrasound.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!isS3UploadConfigured()) {
        return sendError(
          res,
          "NOT_CONFIGURED",
          "S3 is not configured. Set AWS_REGION, AWS_S3_BUCKET (or S3_BUCKET), and credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY or IAM role). For MinIO, set S3_ENDPOINT (e.g. http://localhost:9000). Optional: AWS_S3_PUBLIC_BASE_URL if the URL clients use differs from the API endpoint.",
          503
        );
      }
      const files = (req as AuthRequest & { files?: Record<string, Express.Multer.File[]> })
        .files;
      const file =
        files?.file?.[0] ?? files?.image?.[0];
      if (!file?.buffer) {
        return sendError(
          res,
          "VALIDATION_ERROR",
          "file required (multipart field name file, or image for legacy)",
          400
        );
      }
      const mime = file.mimetype || "";
      if (!mime.startsWith("image/") && !mime.startsWith("video/")) {
        return sendError(
          res,
          "VALIDATION_ERROR",
          "file must be an image or video",
          400
        );
      }

      let fields;
      try {
        fields = parseUltrasoundMultipartFields(
          req.body as Record<string, unknown>
        );
      } catch (e: unknown) {
        if (e instanceof AppError && e.statusCode === 400) {
          return sendError(res, "VALIDATION_ERROR", e.message, 400);
        }
        throw e;
      }

      const visit = await db.visit.findUnique({
        where: { id: fields.visitId },
      });
      if (!visit) {
        return sendError(res, "NOT_FOUND", "Visit not found", 404);
      }

      const imageUrl = await uploadUltrasoundMedia(file.buffer, mime);
      const created = await UltrasoundService.createUltrasound({
        patientId: visit.patientId,
        visitId: fields.visitId,
        takenById: req.user!.id,
        imageUrl,
        capturedAt: fields.capturedAt,
        gain: fields.gain,
        depth: fields.depth,
        dynamicRange: fields.dynamicRange,
      });
      const u = await db.ultrasound.findUnique({
        where: { id: created.id },
        include: {
          patient: true,
          takenBy: true,
          visit: { select: { id: true, visitCaseCategory: true } },
        },
      });
      if (!u) return sendError(res, "ERROR", "Create failed", 500);
      sendData(
        res,
        mapUltrasoundToApi(
          u,
          u.patient.fullName,
          u.takenBy.fullName ?? u.takenBy.phone,
          u.visit
        ),
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
        include: {
          patient: true,
          takenBy: true,
          visit: { select: { id: true, visitCaseCategory: true } },
        },
      });
      if (!u) return sendError(res, "NOT_FOUND", "Ultrasound not found", 404);
      sendData(
        res,
        mapUltrasoundToApi(
          u,
          u.patient.fullName,
          u.takenBy.fullName ?? u.takenBy.phone,
          u.visit
        )
      );
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
