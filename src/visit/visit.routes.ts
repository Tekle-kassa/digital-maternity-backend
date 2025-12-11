import { Router } from "express";
import { VisitController } from "./visit.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

const CLINICAL_ROLES = ["MIDWIFE", "DOCTOR"];

router.post(
  "/",
  authenticate,
  authorizeRoles(...CLINICAL_ROLES),
  VisitController.create
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles(...CLINICAL_ROLES),
  VisitController.getOne
);

router.get(
  "/patient/:patientId",
  authenticate,
  authorizeRoles(...CLINICAL_ROLES),
  VisitController.listByPatient
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles(...CLINICAL_ROLES),
  VisitController.update
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles(...CLINICAL_ROLES),
  VisitController.delete
);

export default router;
