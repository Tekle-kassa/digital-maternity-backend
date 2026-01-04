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
 * /api/v1/patient:
 *   post:
 *     summary: Create a new patient
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
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
