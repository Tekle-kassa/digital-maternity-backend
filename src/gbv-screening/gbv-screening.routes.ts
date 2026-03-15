import { Router } from "express";
import { GBVScreeningController } from "./gbv-screening.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/gbv-screening:
 *   post:
 *     summary: Create GBV screening (Register Survivor – full UI form)
 *     description: Accepts the full GBV Screening and Registration form – consent, comprehensive history, vital signs, physical exam, working diagnosis, laboratory, test results, ultrasound request, treatment plan. recordedById set from auth token. Basic info (name, age, location, etc.) use POST /patient first; referral use GBV report or screening context.
 *     tags: [GBV Screening]
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
 *               gbvReportId:
 *                 type: string
 *                 format: uuid
 *               survivorConsentSignature:
 *                 type: string
 *               caseWorkerConsentSignature:
 *                 type: string
 *               gbvHistory:
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
 *               pregnancyTestingResults:
 *                 type: string
 *               hivTestingResults:
 *                 type: string
 *               stiTestingResults:
 *                 type: string
 *               postExposureProphylaxisTreatment:
 *                 type: string
 *               emergencyContraceptiveProvision:
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
 *         description: GBV case registered successfully
 */
router.post("/", authenticate, GBVScreeningController.create);

/**
 * @swagger
 * /api/v1/gbv-screening/{id}:
 *   get:
 *     summary: Get GBV screening by ID
 *     tags: [GBV Screening]
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
 *         description: GBV screening details
 */
router.get("/:id", authenticate, GBVScreeningController.getOne);

/**
 * @swagger
 * /api/v1/gbv-screening/patient/{patientId}:
 *   get:
 *     summary: Get all GBV screenings for a patient
 *     tags: [GBV Screening]
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
 *         description: List of GBV screenings
 */
router.get(
  "/patient/:patientId",
  authenticate,
  GBVScreeningController.getByPatient
);

/**
 * @swagger
 * /api/v1/gbv-screening/gbv-report/{gbvReportId}:
 *   get:
 *     summary: Get all GBV screenings for a GBV report
 *     tags: [GBV Screening]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gbvReportId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of GBV screenings
 */
router.get(
  "/gbv-report/:gbvReportId",
  authenticate,
  GBVScreeningController.getByGBVReport
);

/**
 * @swagger
 * /api/v1/gbv-screening/{id}:
 *   patch:
 *     summary: Update GBV screening
 *     tags: [GBV Screening]
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
 *         description: GBV screening updated successfully
 */
router.patch("/:id", authenticate, GBVScreeningController.update);

/**
 * @swagger
 * /api/v1/gbv-screening/{id}:
 *   delete:
 *     summary: Delete GBV screening
 *     tags: [GBV Screening]
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
 *         description: GBV screening deleted successfully
 */
router.delete("/:id", authenticate, GBVScreeningController.delete);

export default router;
