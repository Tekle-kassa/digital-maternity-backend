import { Router } from "express";
import { PNCController } from "./pnc.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/pnc:
 *   post:
 *     summary: Create PNC visit (PNC Medical Recording – full UI form)
 *     description: Accepts the full PNC Medical Recording form – consent, postpartum vitals, uterine assessment, anemia/vaginal/breast/vitamin A/counseling, baby health, HIV, referrals, remark, action. recordedById set from auth token.
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
 *               clientConsentSignature:
 *                 type: string
 *                 description: Consent Form PNC Client – Signature
 *               healthProfessionalConsentSignature:
 *                 type: string
 *                 description: Consent Form Health Professional – Signature
 *               visitDate:
 *                 type: string
 *                 format: date-time
 *               bloodPressure:
 *                 type: string
 *                 description: BP
 *               tpr:
 *                 type: string
 *                 description: Temperature, Pulse, Respiration
 *               temperature:
 *                 type: number
 *               uterusContracted:
 *                 type: string
 *                 description: Uterus Contracted/Look for PPH
 *               dribblingLeakingUrine:
 *                 type: string
 *                 description: Dribbling, Leaking Urine
 *               anemia:
 *                 type: string
 *               vaginalDischarge:
 *                 type: string
 *                 description: Vaginal discharge (after 4wks Delivery)
 *               breast:
 *                 type: string
 *               vitaminA:
 *                 type: string
 *               counselingDangerSigns:
 *                 type: string
 *                 description: Counseling danger signs EPI, Use of ITN given
 *               babyBreathing:
 *                 type: string
 *               babyBreastFeeding:
 *                 type: string
 *               babyWeightGm:
 *                 type: number
 *                 description: Baby Wt.(gm.)
 *               immunization:
 *                 type: string
 *               hivTested:
 *                 type: string
 *               hivTestResult:
 *                 type: string
 *                 description: R/NR
 *               arvPxForMother:
 *                 type: string
 *                 description: ARV Px for Mother
 *               arvPxForNewborn:
 *                 type: string
 *                 description: ARV Px for Newborn
 *               feedingOption:
 *                 type: string
 *                 description: EBF/RF
 *               motherReferredToCare:
 *                 type: string
 *                 description: Mother Referred to Care & Support
 *               newbornReferredToCare:
 *                 type: string
 *                 description: Newborn referred to Chronic HIV infant Care
 *               fpCounseledAndProvided:
 *                 type: string
 *                 description: Postpartum FP Counseled & Provided
 *               remark:
 *                 type: string
 *               actionTaken:
 *                 type: string
 *     responses:
 *       201:
 *         description: PNC case registered successfully
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
