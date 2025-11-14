import { Router } from "express";
import { UltrasoundController } from "./ultrasound.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

import { Role } from "../../generated/prisma/enums";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRoles(Role.HealthWorker),
  UltrasoundController.createScan
);
router.get(
  "/:patientId",
  authorizeRoles(Role.HealthWorker, Role.Supervisor),
  UltrasoundController.getScansByPatient
);
router.patch(
  "/:scanId",
  authorizeRoles(Role.HealthWorker),
  UltrasoundController.updateScan
);

export default router;
