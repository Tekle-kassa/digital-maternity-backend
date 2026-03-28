import { Router } from "express";
import { PatientController } from "./patient.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import patientsV1 from "../v1/patients.router";

const ALLOWED = ["MIDWIFE", "DOCTOR"];

const router = Router();

/**
 * @swagger
 * /api/v1/patient/anc/basic-information:
 *   post:
 *     summary: ANC flow — Step 1 (Basic Information only)
 *     description: Creates a Patient with demographics from the Basic Information screen only. Does not create an ANC record. Card number is generated server-side (returned on the patient object).
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
 *               fullName: { type: string, example: "Hawot Gebre" }
 *               age: { type: integer, example: 26 }
 *               facility: { type: string }
 *               maritalStatus: { type: string }
 *               subCity: { type: string }
 *               woreda: { type: string }
 *               kebele: { type: string }
 *               houseNo: { type: string }
 *               phone: { type: string, description: "Optional; duplicate phone rejected if set" }
 *               emergencyContact: { type: string }
 *               emergencyPhone: { type: string }
 *     responses:
 *       201:
 *         description: Patient created; use patientId for next steps
 *       400:
 *         description: Validation or duplicate phone
 */
router.post(
  "/anc/basic-information",
  authenticate,
  authorizeRoles(...ALLOWED),
  PatientController.createAncBasicInformation
);

/**
 * @swagger
 * /api/v1/patient/register-client:
 *   post:
 *     summary: Register client — full ANC form (legacy UI)
 *     description: Creates Patient + ANC record in one transaction. Same as before DMP merge.
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
 *               fullName: { type: string, minLength: 3 }
 *               phone: { type: string }
 *               cardNo: { type: string }
 *               lmp: { type: string, format: date }
 *               edd: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Patient and ANC record created
 *       400:
 *         description: Validation or duplicate phone
 */
router.post(
  "/register-client",
  authenticate,
  authorizeRoles(...ALLOWED),
  PatientController.registerClient
);

/** UNFPA DMP-style patient API (API-REFERENCE.md) — same as GET/POST /api/v1/patients */
router.use("/", patientsV1);

export default router;
