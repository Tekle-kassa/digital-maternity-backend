import { Router } from "express";
import { DeliveryController } from "./delivery.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/delivery:
 *   post:
 *     summary: Delivery Summary Recording (screens 1–7)
 *     description: |
 *       Maps the Register Client → Delivery Summary Recording UI:
 *       - **Screen 1 – Consent:** clientConsentSignature, healthProfessionalConsentSignature
 *       - **Screen 2 – Delivery details:** deliveryDate, deliveryTime, referral, referralInfo, amtsl (one drug or array), placenta, laceration
 *       - **Screen 3 – Management:** obstetricCxManaged, aphManaged, rupturedUx, eclampsiaManaged, pphManaged, promSepsisManaged, obstPrologLaborManaged
 *       - **Screen 4 – Assistance:** deliveryAssistanceMeasures, deliveryAssistanceMore
 *       - **Screens 5–6 – Newborn(s):** newborns[] (quantity, sex, termStatus, alive, apgarScore, sb, birthWeightGm, lengthCm, vitK, ttc, babyMotherBonding)
 *       - **Screen 7 – HIV / post-delivery:** hivCounsTestingOffered, hivTestingAccepted, hivTestResult (Yes/No or R/NR/I), arvpxForMothers, arvpxForNb, feedingOptionEbf, rf or **bc** (bc is stored as rf)
 *       `recordedById` is set from the JWT.
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId]
 *             properties:
 *               patientId: { type: string, format: uuid }
 *               pregnancyId: { type: string, format: uuid }
 *               clientConsentSignature: { type: string }
 *               healthProfessionalConsentSignature: { type: string }
 *               deliveryDate: { type: string, format: date }
 *               deliveryTime: { type: string }
 *               referral: { type: boolean }
 *               referralInfo: { type: string }
 *               amtsl:
 *                 oneOf:
 *                   - type: string
 *                     enum: [Ergometrine, Oxytocin, Misoprostol]
 *                   - type: array
 *                     items:
 *                       type: string
 *                       enum: [Ergometrine, Oxytocin, Misoprostol]
 *                 description: Single selection or multiple (stored comma-separated)
 *               placenta:
 *                 type: string
 *                 enum: [Completed, Incomplete, CCT, MRP, NRP]
 *               laceration:
 *                 type: string
 *                 enum: ["1st Degree", "2nd Degree", "3rd Degree"]
 *               obstetricCxManaged: { type: boolean }
 *               aphManaged: { type: boolean }
 *               rupturedUx: { type: boolean }
 *               eclampsiaManaged: { type: boolean }
 *               pphManaged: { type: boolean }
 *               promSepsisManaged: { type: boolean }
 *               obstPrologLaborManaged: { type: boolean }
 *               deliveryAssistanceMeasures: { type: string }
 *               deliveryAssistanceMore: { type: string }
 *               hivCounsTestingOffered: { type: string, description: Prefer Yes/No }
 *               hivTestingAccepted: { type: string }
 *               hivTestResult: { type: string }
 *               arvpxForMothers: { type: string }
 *               arvpxForNb: { type: string }
 *               feedingOptionEbf: { type: string }
 *               rf: { type: string }
 *               bc: { type: string, description: UI label BC; maps to rf if rf omitted }
 *               newborns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     quantity: { type: string, enum: [Single, Multiple] }
 *                     sex: { type: string, enum: [Male, Female] }
 *                     termStatus: { type: string, enum: [Term, Preterm] }
 *                     alive: { type: boolean }
 *                     apgarScore: { type: integer, minimum: 0, maximum: 10 }
 *                     sb: { type: string, enum: [Mac, Fresh] }
 *                     birthWeightGm: { type: number }
 *                     lengthCm: { type: number }
 *                     vitK: { type: boolean, description: Vit K (not NUK) }
 *                     ttc: { type: boolean }
 *                     babyMotherBonding: { type: boolean }
 *     responses:
 *       201:
 *         description: Delivery created; message matches success flow
 */
router.post("/", authenticate, DeliveryController.create);

/**
 * @swagger
 * /api/v1/delivery/{id}:
 *   get:
 *     summary: Get delivery by ID
 *     tags: [Delivery]
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
 *         description: Delivery details
 */
router.get("/:id", authenticate, DeliveryController.getOne);

/**
 * @swagger
 * /api/v1/delivery/patient/{patientId}:
 *   get:
 *     summary: Get all deliveries for a patient
 *     tags: [Delivery]
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
 *         description: List of deliveries
 */
router.get(
  "/patient/:patientId",
  authenticate,
  DeliveryController.getByPatient
);

/**
 * @swagger
 * /api/v1/delivery/pregnancy/{pregnancyId}:
 *   get:
 *     summary: Get all deliveries for a pregnancy
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pregnancyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of deliveries
 */
router.get(
  "/pregnancy/:pregnancyId",
  authenticate,
  DeliveryController.getByPregnancy
);

/**
 * @swagger
 * /api/v1/delivery/{id}:
 *   patch:
 *     summary: Update delivery record
 *     tags: [Delivery]
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
 *         description: Delivery updated successfully
 */
router.patch("/:id", authenticate, DeliveryController.update);

/**
 * @swagger
 * /api/v1/delivery/{id}:
 *   delete:
 *     summary: Delete delivery record
 *     tags: [Delivery]
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
 *         description: Delivery deleted successfully
 */
router.delete("/:id", authenticate, DeliveryController.delete);

export default router;
