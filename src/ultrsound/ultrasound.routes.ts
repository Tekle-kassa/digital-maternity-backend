import { Router } from "express";
import { UltrasoundController } from "./ultrasound.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import { ultrasoundUpload } from "../common/multerS3";

const router = Router();

const CLINICAL_ROLES = ["MIDWIFE", "DOCTOR"];

/**
 * @swagger
 * /api/v1/ultrasound:
 *   post:
 *     summary: Create ultrasound scan (with image upload)
 *     tags: [Ultrasound]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - image
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               visitId:
 *                 type: string
 *                 format: uuid
 *               image:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *               gestationalAge:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Ultrasound scan created successfully
 */
router.post(
  "/",
  authenticate,
  authorizeRoles(...CLINICAL_ROLES),
  ultrasoundUpload.single("image"),
  UltrasoundController.create
);

/**
 * @swagger
 * /api/v1/ultrasound/patient/{patientId}:
 *   get:
 *     summary: Get all ultrasound scans for a patient
 *     tags: [Ultrasound]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of ultrasound scans
 */
router.get(
  "/patient/:patientId",
  authenticate,
  authorizeRoles(...CLINICAL_ROLES),
  UltrasoundController.listByPatient
);

/**
 * @swagger
 * /api/v1/ultrasound/{id}:
 *   get:
 *     summary: Get ultrasound scan by ID
 *     tags: [Ultrasound]
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
 *         description: Ultrasound scan details
 */
router.get(
  "/:id",
  authenticate,
  authorizeRoles(...CLINICAL_ROLES),
  UltrasoundController.getOne
);

/**
 * @swagger
 * /api/v1/ultrasound/{id}:
 *   patch:
 *     summary: Update ultrasound scan
 *     tags: [Ultrasound]
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
 *         description: Ultrasound scan updated successfully
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles(...CLINICAL_ROLES),
  UltrasoundController.update
);

/**
 * @swagger
 * /api/v1/ultrasound/{id}:
 *   delete:
 *     summary: Delete ultrasound scan
 *     tags: [Ultrasound]
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
 *         description: Ultrasound scan deleted successfully
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(...CLINICAL_ROLES),
  UltrasoundController.delete
);

export default router;
