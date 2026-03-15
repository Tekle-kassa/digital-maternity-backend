import { Router } from "express";
import { DeliveryController } from "./delivery.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/delivery:
 *   post:
 *     summary: Create delivery record (Delivery Summary Recording – full UI form)
 *     description: Accepts the full Delivery Summary Recording form – consent, delivery details, referral, AMTSL, placenta, laceration, management conditions, delivery assistance, HIV section, and newborns array. recordedById is set from auth token.
 *     tags: [Delivery]
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
 *               pregnancyId:
 *                 type: string
 *                 format: uuid
 *               clientConsentSignature:
 *                 type: string
 *                 description: Consent Form Delivery Client – Signature
 *               healthProfessionalConsentSignature:
 *                 type: string
 *                 description: Consent Form Health Professional – Signature
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *               deliveryTime:
 *                 type: string
 *               referral:
 *                 type: boolean
 *                 description: Referral Yes/No
 *               referralInfo:
 *                 type: string
 *                 description: Optional referral details
 *               amtsl:
 *                 type: string
 *                 enum: [Ergometrine, Oxytocin, Misoprostol]
 *               placenta:
 *                 type: string
 *                 enum: [Completed, Incomplete, CCT, MRP, NRP]
 *               laceration:
 *                 type: string
 *                 enum: [1st Degree, 2nd Degree, 3rd Degree]
 *               obstetricCxManaged:
 *                 type: boolean
 *               aphManaged:
 *                 type: boolean
 *               rupturedUx:
 *                 type: boolean
 *               eclampsiaManaged:
 *                 type: boolean
 *               pphManaged:
 *                 type: boolean
 *               promSepsisManaged:
 *                 type: boolean
 *               obstPrologLaborManaged:
 *                 type: boolean
 *               deliveryAssistanceMeasures:
 *                 type: string
 *               deliveryAssistanceMore:
 *                 type: string
 *               hivCounsTestingOffered:
 *                 type: string
 *               hivTestingAccepted:
 *                 type: string
 *               hivTestResult:
 *                 type: string
 *               arvpxForMothers:
 *                 type: string
 *               arvpxForNb:
 *                 type: string
 *               feedingOptionEbf:
 *                 type: string
 *               rf:
 *                 type: string
 *               newborns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     quantity:
 *                       type: string
 *                       enum: [Single, Multiple]
 *                     sex:
 *                       type: string
 *                       enum: [Male, Female]
 *                     termStatus:
 *                       type: string
 *                       enum: [Term, Preterm]
 *                     alive:
 *                       type: boolean
 *                     apgarScore:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 10
 *                     sb:
 *                       type: string
 *                       enum: [Mac, Fresh]
 *                     birthWeightGm:
 *                       type: number
 *                     lengthCm:
 *                       type: number
 *                     vitK:
 *                       type: boolean
 *                     ttc:
 *                       type: boolean
 *                     babyMotherBonding:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Delivery record created successfully (Delivery Overview registered)
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
