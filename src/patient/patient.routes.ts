import { Router } from "express";
import { PatientController } from "./patient.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

const ALLOWED = ["MIDWIFE", "DOCTOR"];

const router = Router();

/**
 * @swagger
 * /api/v1/patient:
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 patients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 */
router.get(
  "/",
  authenticate,
  authorizeRoles(...ALLOWED),
  PatientController.list
);

/**
 * @swagger
 * /api/v1/patient/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
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
 *         description: Patient details
 *       404:
 *         description: Patient not found
 */
router.get("/:id", authenticate, PatientController.getOne);

/**
 * @swagger
 * /api/v1/patient/register-client:
 *   post:
 *     summary: Register client (full ANC form – all UI steps in one request)
 *     description: Accepts the complete Register Client form matching the ANC Medical Recording UI. Creates Patient + ANC record in one transaction. Only fullName is required; all other fields optional.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName]
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 3
 *               cardNo:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               age:
 *                 type: integer
 *               address:
 *                 type: string
 *               subCity:
 *                 type: string
 *               woreda:
 *                 type: string
 *               kebele:
 *                 type: string
 *               houseNo:
 *                 type: string
 *               facility:
 *                 type: string
 *               maritalStatus:
 *                 type: string
 *               idNumber:
 *                 type: string
 *               emergencyContact:
 *                 type: string
 *               emergencyPhone:
 *                 type: string
 *               clientConsentSignature:
 *                 type: string
 *               healthProfessionalConsentSignature:
 *                 type: string
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
 *               abortion:
 *                 type: integer
 *               ectopicPreg:
 *                 type: integer
 *               childrenAlive:
 *                 type: integer
 *               pastObstetricHistory:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     year: { type: string }
 *                     ga: { type: string }
 *                     modeOfDelivery: { type: string }
 *                     sex: { type: string }
 *                     birthWeightKg: { type: number }
 *               diabetesMellitus:
 *                 type: boolean
 *               diabetesMellitusMoreInfo:
 *                 type: string
 *               cardiacDisease:
 *                 type: boolean
 *               cardiacDiseaseMoreInfo:
 *                 type: string
 *               chronicHypertension:
 *                 type: boolean
 *               chronicHypertensionMoreInfo:
 *                 type: string
 *               otherMedicalCondition:
 *                 type: boolean
 *               otherMedicalConditionText:
 *                 type: string
 *               vdrl:
 *                 type: string
 *               hiv:
 *                 type: string
 *               hbsAg:
 *                 type: string
 *               rbs:
 *                 type: string
 *               fbs:
 *                 type: string
 *               bloodGroupRh:
 *                 type: string
 *               ua:
 *                 type: string
 *               td:
 *                 type: string
 *               generalExamGeneral:
 *                 type: string
 *               generalExamPallor:
 *                 type: string
 *               jaundice:
 *                 type: boolean
 *               chestAbnormality:
 *                 type: boolean
 *               chestAbnormalityMoreInfo:
 *                 type: string
 *               heartAbnormality:
 *                 type: boolean
 *               heartAbnormalityMoreInfo:
 *                 type: string
 *               vulvarUlcer:
 *                 type: boolean
 *               vaginalDischarge:
 *                 type: boolean
 *               pelvicMass:
 *                 type: boolean
 *               cervicalLesion:
 *                 type: boolean
 *               uterineSizeWks:
 *                 type: integer
 *               dangerSignsAdvised:
 *                 type: boolean
 *               birthPreparednessAdvised:
 *                 type: boolean
 *               motherHivTestAccepted:
 *                 type: boolean
 *               hivTestResult:
 *                 type: string
 *               hivTestResultReceived:
 *                 type: boolean
 *               counseledInfantFeeding:
 *                 type: boolean
 *               referredForCare:
 *                 type: boolean
 *               partnerHivTestResult:
 *                 type: string
 *               gaLmp:
 *                 type: string
 *               complaints:
 *                 type: string
 *               bloodPressure:
 *                 type: string
 *               weightKg:
 *                 type: number
 *               pallor:
 *                 type: string
 *               hemoglobin:
 *                 type: string
 *               uterineHeightWks:
 *                 type: integer
 *               presentation:
 *                 type: string
 *               descent:
 *                 type: string
 *               fetalHeartRate:
 *                 type: string
 *               remarks:
 *                 type: string
 *               nextFollowUpDate:
 *                 type: string
 *                 format: date
 *               dangerSignsIdentified:
 *                 type: string
 *               actionAdviceCounselling:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client and ANC case registered successfully
 *       400:
 *         description: Validation error or phone already exists
 */
router.post(
  "/register-client",
  authenticate,
  authorizeRoles(...ALLOWED),
  PatientController.registerClient
);

/**
 * @swagger
 * /api/v1/patient:
 *   post:
 *     summary: Create a new patient (basic info only)
 *     description: Creates only a patient record. For full Register Client (patient + ANC), use POST /register-client.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 3
 *               cardNo:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               age:
 *                 type: integer
 *               address:
 *                 type: string
 *               subCity:
 *                 type: string
 *               woreda:
 *                 type: string
 *               kebele:
 *                 type: string
 *               houseNo:
 *                 type: string
 *               facility:
 *                 type: string
 *               maritalStatus:
 *                 type: string
 *               idNumber:
 *                 type: string
 *               emergencyContact:
 *                 type: string
 *               emergencyPhone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  authenticate,
  authorizeRoles(...ALLOWED),
  PatientController.create
);

/**
 * @swagger
 * /api/v1/patient/{id}:
 *   patch:
 *     summary: Update patient
 *     tags: [Patients]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 3
 *               cardNo:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               age:
 *                 type: integer
 *               address:
 *                 type: string
 *               subCity:
 *                 type: string
 *               woreda:
 *                 type: string
 *               kebele:
 *                 type: string
 *               houseNo:
 *                 type: string
 *               facility:
 *                 type: string
 *               maritalStatus:
 *                 type: string
 *               idNumber:
 *                 type: string
 *               emergencyContact:
 *                 type: string
 *               emergencyPhone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       404:
 *         description: Patient not found
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles(...ALLOWED),
  PatientController.update
);

/**
 * @swagger
 * /api/v1/patient/{id}:
 *   delete:
 *     summary: Delete patient
 *     tags: [Patients]
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
 *         description: Patient deleted successfully
 *       404:
 *         description: Patient not found
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(...ALLOWED),
  PatientController.delete
);
export default router;
