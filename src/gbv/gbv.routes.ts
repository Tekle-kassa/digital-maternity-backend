import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import { ultrasoundUpload } from "../common/multerS3";
import { GBVController } from "./gbv.controller";
const router = Router();

/**
 * @swagger
 * /api/v1/gbv:
 *   post:
 *     summary: Create GBV report (with attachment upload)
 *     tags: [GBV Reports]
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
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               incidentDate:
 *                 type: string
 *                 format: date
 *               attachment:
 *                 type: string
 *                 format: binary
 *               highRisk:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: GBV report created successfully
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("MIDWIFE", "GBV_OFFICER"),
  ultrasoundUpload.single("attachment"),
  GBVController.create
);

/**
 * @swagger
 * /api/v1/gbv/patient/{patientId}:
 *   get:
 *     summary: Get all GBV reports for a patient
 *     tags: [GBV Reports]
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
 *         description: List of GBV reports
 */
router.get(
  "/patient/:patientId",
  authenticate,
  authorizeRoles("MIDWIFE", "GBV_OFFICER"),
  GBVController.listByPatient
);

/**
 * @swagger
 * /api/v1/gbv/{id}:
 *   get:
 *     summary: Get GBV report by ID
 *     tags: [GBV Reports]
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
 *         description: GBV report details
 */
router.get(
  "/:id",
  authenticate,
  authorizeRoles("MIDWIFE", "GBV_OFFICER"),
  GBVController.getOne
);

/**
 * @swagger
 * /api/v1/gbv/{id}:
 *   patch:
 *     summary: Update GBV report
 *     tags: [GBV Reports]
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
 *         description: GBV report updated successfully
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("MIDWIFE", "GBV_OFFICER"),
  GBVController.update
);

/**
 * @swagger
 * /api/v1/gbv/{id}:
 *   delete:
 *     summary: Delete GBV report
 *     tags: [GBV Reports]
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
 *         description: GBV report deleted successfully
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("MIDWIFE", "GBV_OFFICER"),
  GBVController.delete
);
export default router;
