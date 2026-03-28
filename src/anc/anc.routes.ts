import { Router } from "express";
import { ANCController } from "./anc.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/anc:
 *   post:
 *     summary: ANC Medical Recording — register clinical record (UI flow)
 *     description: |
 *       Creates one **ANCRecord** for a patient already created via `POST /patient/anc/basic-information`.
 *       Send `patientId` and any combination of fields grouped by your UI screens (all optional except `patientId`).
 *       - Basic Information (cont'd): lmp, edd, gravida, para, abortion, ectopicPreg, childrenAlive
 *       - Past Obstetric History: pastObstetricHistory[]
 *       - General Medical History: diabetes/cardiac/chronic HTN/other + *MoreInfo / *Text
 *       - Lab Tests: vdrl, hiv, hbsAg, rbs, fbs, bloodGroupRh, ua
 *       - Supplement: td — TD1 | TD2 | TD3 | TD4 | TD5
 *       - General Exam: generalExamGeneral, generalExamPallor, jaundice, chest/heart abnormality + more info
 *       - Gyn Exam: vulvarUlcer, vaginalDischarge, pelvicMass, cervicalLesion, uterineSizeWks
 *       - Counseling/Testing: dangerSignsAdvised, birthPreparednessAdvised, motherHivTestAccepted, hivTestResult (R|NR|I)
 *       - HIV + Care: hivTestResultReceived, counseledInfantFeeding, referredForCare, partnerHivTestResult (R|NR|I)
 *       - Present Pregnancy follow-up: gaLmp, complaints, bloodPressure, weightKg, pallor, hemoglobin, uterineHeightWks, presentation, descent, fetalHeartRate, remarks, nextFollowUpDate, dangerSignsIdentified, actionAdviceCounselling
 *     tags: [ANC]
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
 *               clientConsentSignature: { type: string }
 *               healthProfessionalConsentSignature: { type: string }
 *               lmp: { type: string, format: date }
 *               edd: { type: string, format: date }
 *               gravida: { type: integer }
 *               para: { type: integer }
 *               abortion: { type: integer }
 *               ectopicPreg: { type: integer }
 *               childrenAlive: { type: integer }
 *               pastObstetricHistory:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     year: { type: string }
 *                     ga: { type: string }
 *                     modeOfDelivery: { type: string }
 *                     sex: { type: string }
 *                     birthWeightKg: { oneOf: [{ type: number }, { type: string }] }
 *               diabetesMellitus: { type: boolean }
 *               diabetesMellitusMoreInfo: { type: string }
 *               cardiacDisease: { type: boolean }
 *               cardiacDiseaseMoreInfo: { type: string }
 *               chronicHypertension: { type: boolean }
 *               chronicHypertensionMoreInfo: { type: string }
 *               otherMedicalCondition: { type: boolean }
 *               otherMedicalConditionText: { type: string }
 *               vdrl: { type: string }
 *               hiv: { type: string }
 *               hbsAg: { type: string }
 *               rbs: { type: string }
 *               fbs: { type: string }
 *               bloodGroupRh: { type: string }
 *               ua: { type: string }
 *               td: { type: string, enum: [TD1, TD2, TD3, TD4, TD5] }
 *               generalExamGeneral: { type: string }
 *               generalExamPallor: { type: string }
 *               jaundice: { type: boolean }
 *               chestAbnormality: { type: boolean }
 *               chestAbnormalityMoreInfo: { type: string }
 *               heartAbnormality: { type: boolean }
 *               heartAbnormalityMoreInfo: { type: string }
 *               vulvarUlcer: { type: boolean }
 *               vaginalDischarge: { type: boolean }
 *               pelvicMass: { type: boolean }
 *               cervicalLesion: { type: boolean }
 *               uterineSizeWks: { type: integer }
 *               dangerSignsAdvised: { type: boolean }
 *               birthPreparednessAdvised: { type: boolean }
 *               motherHivTestAccepted: { type: boolean }
 *               hivTestResult: { type: string, enum: [R, NR, I] }
 *               hivTestResultReceived: { type: boolean }
 *               counseledInfantFeeding: { type: boolean }
 *               referredForCare: { type: boolean }
 *               partnerHivTestResult: { type: string, enum: [R, NR, I] }
 *               gaLmp: { type: string }
 *               complaints: { type: string }
 *               bloodPressure: { type: string }
 *               weightKg: { type: number }
 *               pallor: { type: string }
 *               hemoglobin: { type: string }
 *               uterineHeightWks: { type: integer }
 *               presentation: { type: string }
 *               descent: { type: string }
 *               fetalHeartRate: { type: string }
 *               remarks: { type: string }
 *               nextFollowUpDate: { type: string, format: date }
 *               dangerSignsIdentified: { type: string }
 *               actionAdviceCounselling: { type: string }
 *     responses:
 *       201:
 *         description: ANC record created; message matches in-app success modal
 */
router.post("/", authenticate, ANCController.create);

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
 * /api/v1/anc/{id}:
 *   patch:
 *     summary: Update ANC record (partial; same field names as POST)
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
