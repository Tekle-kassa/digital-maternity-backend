import { Router } from "express";
import { SRHController } from "./srh.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/srh:
 *   post:
 *     summary: Create SRH registration record
 *     tags: [SRH]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               history:
 *                 type: string
 *               temperature:
 *                 type: string
 *               weightKg:
 *                 type: number
 *               heightCm:
 *                 type: number
 *               workingDiagnosis:
 *                 type: string
 *               treatmentPlan:
 *                 type: string
 *     responses:
 *       201:
 *         description: SRH registration created successfully
 */
router.post("/", authenticate, SRHController.create);

/**
 * @swagger
 * /api/v1/srh/{id}:
 *   get:
 *     summary: Get SRH registration by ID
 *     tags: [SRH]
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
 *         description: SRH registration details
 */
router.get("/:id", authenticate, SRHController.getOne);

/**
 * @swagger
 * /api/v1/srh/patient/{patientId}:
 *   get:
 *     summary: Get all SRH registrations for a patient
 *     tags: [SRH]
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
 *         description: List of SRH registrations
 */
router.get("/patient/:patientId", authenticate, SRHController.getByPatient);

/**
 * @swagger
 * /api/v1/srh/{id}:
 *   patch:
 *     summary: Update SRH registration
 *     tags: [SRH]
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
 *         description: SRH registration updated successfully
 */
router.patch("/:id", authenticate, SRHController.update);

/**
 * @swagger
 * /api/v1/srh/{id}:
 *   delete:
 *     summary: Delete SRH registration
 *     tags: [SRH]
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
 *         description: SRH registration deleted successfully
 */
router.delete("/:id", authenticate, SRHController.delete);

export default router;
