import { Router } from "express";
import { SRHController } from "./srh.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/srh:
 *   post:
 *     summary: Create SRH registration (SRH Medical Registration – full UI form)
 *     description: Accepts the full SRH Medical Registration form – consent, history (SRH service type + history), vital signs, physical examination, working diagnosis, laboratory, ultrasound request, treatment plan. recordedById set from auth token. Basic info (name, age, location, etc.) use POST /patient first.
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
 *               clientConsentSignature:
 *                 type: string
 *               healthProfessionalConsentSignature:
 *                 type: string
 *               srhServiceType:
 *                 type: string
 *                 description: Family Planning, Routine Care, STI/HIV, Others
 *               history:
 *                 type: string
 *               temperature:
 *                 type: string
 *               weightKg:
 *                 type: number
 *               heightCm:
 *                 type: number
 *               bmiIndex:
 *                 type: number
 *               bloodPressure:
 *                 type: string
 *               pulse:
 *                 type: string
 *               respiratoryRate:
 *                 type: string
 *               oxygenSaturation:
 *                 type: string
 *               physicalExamination:
 *                 type: string
 *               workingDiagnosis:
 *                 type: string
 *               laboratoryResults:
 *                 type: string
 *               typeOfUltrasound:
 *                 type: string
 *               ultrasoundMore:
 *                 type: string
 *               smartUltrasoundRecommendation:
 *                 type: string
 *               treatmentPlan:
 *                 type: string
 *               treatmentRx:
 *                 type: string
 *               continuationSheet:
 *                 type: string
 *     responses:
 *       201:
 *         description: SRH case registered successfully
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
