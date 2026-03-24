import { Router } from "express";
import { PatientController } from "./patient.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import patientsV1 from "../v1/patients.router";

const ALLOWED = ["MIDWIFE", "DOCTOR"];

const router = Router();

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
