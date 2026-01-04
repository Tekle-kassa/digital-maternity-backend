import { Router } from "express";
import { ANCController } from "./anc.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/anc:
 *   post:
 *     summary: Create ANC record
 *     tags: [ANC]
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
 *               lmp:
 *                 type: string
 *                 format: date
 *               edd:
 *                 type: string
 *                 format: date
 *               gravida:
 *                 type: integer
 *               para:
 *                 type: integer
 *               diabetesMellitus:
 *                 type: boolean
 *               hiv:
 *                 type: string
 *               bloodGroupRh:
 *                 type: string
 *     responses:
 *       201:
 *         description: ANC record created successfully
 */
router.post("/", authenticate, ANCController.create);

/**
 * @swagger
 * /api/v1/anc/{id}:
 *   get:
 *     summary: Get ANC record by ID
 *     tags: [ANC]
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
 *         description: ANC record details
 */
router.get("/:id", authenticate, ANCController.getOne);

/**
 * @swagger
 * /api/v1/anc/patient/{patientId}:
 *   get:
 *     summary: Get all ANC records for a patient
 *     tags: [ANC]
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
 *         description: List of ANC records
 */
router.get("/patient/:patientId", authenticate, ANCController.getByPatient);

/**
 * @swagger
 * /api/v1/anc/{id}:
 *   patch:
 *     summary: Update ANC record
 *     tags: [ANC]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lmp:
 *                 type: string
 *                 format: date
 *               hiv:
 *                 type: string
 *     responses:
 *       200:
 *         description: ANC record updated successfully
 */
router.patch("/:id", authenticate, ANCController.update);

/**
 * @swagger
 * /api/v1/anc/{id}:
 *   delete:
 *     summary: Delete ANC record
 *     tags: [ANC]
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
 *         description: ANC record deleted successfully
 */
router.delete("/:id", authenticate, ANCController.delete);

export default router;
