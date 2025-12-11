import { Router } from "express";
import { PregnancyController } from "./pregnancy.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

const CLINICAL = ["MIDWIFE", "DOCTOR"];

// Create pregnancy
router.post(
  "/",
  authenticate,
  authorizeRoles(...CLINICAL),
  PregnancyController.create
);

// Get one pregnancy
router.get(
  "/:id",
  authenticate,
  authorizeRoles(...CLINICAL),
  PregnancyController.getOne
);

// List pregnancies for a patient
router.get(
  "/patient/:patientId",
  authenticate,
  authorizeRoles(...CLINICAL),
  PregnancyController.listByPatient
);

// Update pregnancy
router.patch(
  "/:id",
  authenticate,
  authorizeRoles(...CLINICAL),
  PregnancyController.update
);

// End pregnancy
router.post(
  "/:id/end",
  authenticate,
  authorizeRoles(...CLINICAL),
  PregnancyController.end
);

export default router;
