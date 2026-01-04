import { Router } from "express";
import { PNCController } from "./pnc.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/pnc:
 *   post:
 *     summary: Create PNC visit record
 *     tags: [PNC]
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
 *               deliveryId:
 *                 type: string
 *                 format: uuid
 *               bloodPressure:
 *                 type: string
 *               temperature:
 *                 type: number
 *               babyBreathing:
 *                 type: string
 *               babyBreastFeeding:
 *                 type: string
 *               hivTested:
 *                 type: string
 *     responses:
 *       201:
 *         description: PNC visit created successfully
 */
router.post("/", authenticate, PNCController.create);

/**
 * @swagger
 * /api/v1/pnc/{id}:
 *   get:
 *     summary: Get PNC visit by ID
 *     tags: [PNC]
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
 *         description: PNC visit details
 */
router.get("/:id", authenticate, PNCController.getOne);

/**
 * @swagger
 * /api/v1/pnc/patient/{patientId}:
 *   get:
 *     summary: Get all PNC visits for a patient
 *     tags: [PNC]
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
 *         description: List of PNC visits
 */
router.get("/patient/:patientId", authenticate, PNCController.getByPatient);

/**
 * @swagger
 * /api/v1/pnc/delivery/{deliveryId}:
 *   get:
 *     summary: Get all PNC visits for a delivery
 *     tags: [PNC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of PNC visits
 */
router.get("/delivery/:deliveryId", authenticate, PNCController.getByDelivery);

/**
 * @swagger
 * /api/v1/pnc/{id}:
 *   patch:
 *     summary: Update PNC visit
 *     tags: [PNC]
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
 *         description: PNC visit updated successfully
 */
router.patch("/:id", authenticate, PNCController.update);

/**
 * @swagger
 * /api/v1/pnc/{id}:
 *   delete:
 *     summary: Delete PNC visit
 *     tags: [PNC]
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
 *         description: PNC visit deleted successfully
 */
router.delete("/:id", authenticate, PNCController.delete);

export default router;
