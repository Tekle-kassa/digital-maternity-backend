import { Router, Response, NextFunction } from "express";
import db from "./db";
import { authenticate, AuthRequest } from "../middleware/authMiddleware";
import { sendData, sendError } from "./helpers";
import { ultrasoundUpload } from "../common/multerS3";
import { z } from "zod";

const router = Router();

/**
 * @swagger
 * /api/v1/files/upload:
 *   post:
 *     summary: Upload file (multipart file plus category)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, category]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *                 enum: [ultrasound, attachment, avatar, document]
 *     responses:
 *       201:
 *         description: Created file metadata
 */
router.post(
  "/upload",
  authenticate,
  ultrasoundUpload.single("file"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
      if (!file) return sendError(res, "VALIDATION_ERROR", "file required", 400);
      const body = z
        .object({
          category: z.enum(["ultrasound", "attachment", "avatar", "document"]),
        })
        .parse(req.body);
      const loc = (file as Express.Multer.File & { location?: string; size?: number }).location ?? "";
      const size = BigInt(file.size ?? 0);
      const rec = await db.uploadedFile.create({
        data: {
          filename: file.originalname,
          url: loc,
          size,
          mimeType: file.mimetype,
          category: body.category,
          uploadedById: req.user!.id,
        },
      });
      sendData(
        res,
        {
          id: rec.id,
          url: rec.url,
          filename: rec.filename,
          size: Number(rec.size),
          mimeType: rec.mimeType,
          category: rec.category.toLowerCase(),
          uploadedAt: rec.createdAt.toISOString(),
        },
        201
      );
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/files/{id}:
 *   get:
 *     summary: File metadata by id (uploader or admin)
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
      const f = await db.uploadedFile.findUnique({ where: { id: req.params.id } });
      if (!f) return sendError(res, "NOT_FOUND", "Not found", 404);
      const isUploader = f.uploadedById === req.user!.id;
      const roles = req.user!.roles ?? [];
      if (!isUploader && !roles.includes("ADMIN")) return sendError(res, "FORBIDDEN", "Forbidden", 403);
      sendData(res, {
        id: f.id,
        url: f.url,
        filename: f.filename,
        size: Number(f.size),
        mimeType: f.mimeType,
        category: f.category.toLowerCase(),
        uploadedAt: f.createdAt.toISOString(),
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/files/{id}:
 *   delete:
 *     summary: Delete file (uploader or admin)
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
      const f = await db.uploadedFile.findUnique({ where: { id: req.params.id } });
      if (!f) return sendError(res, "NOT_FOUND", "Not found", 404);
      const roles = req.user!.roles ?? [];
      if (f.uploadedById !== req.user!.id && !roles.includes("ADMIN"))
        return sendError(res, "FORBIDDEN", "Forbidden", 403);
      await db.uploadedFile.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
