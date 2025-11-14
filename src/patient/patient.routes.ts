import { Router } from "express";
import { PatientController } from "./patient.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import { Role } from "../../generated/prisma/enums";

const router = Router();

router.get("/", authenticate, PatientController.getPatients);
router.get("/:patientId", authenticate, PatientController.getPatientById);

router.post(
  "/",
  authenticate,
  authorizeRoles(Role.Admin, Role.HealthWorker),
  PatientController.createPatient
);
router.patch(
  "/:patientId",
  authenticate,
  authorizeRoles(Role.HealthWorker, Role.Admin),
  PatientController.updatePatient
);

export default router;
