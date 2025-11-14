import { Router } from "express";
import { ANCController } from "./anc.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

import { Role } from "../../generated/prisma/client";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles(Role.HealthWorker, Role.Supervisor, Role.Admin),
  ANCController.createANCVisit
);

router.get("/", authenticate, ANCController.getAllVisits);
router.get("/:patientId", authenticate, ANCController.getVisitsByPatient);
router.put("/:visitId", authenticate, ANCController.updateANCVisit);

export default router;
