import { Router } from "express";
import { PatientController } from "./patient.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

const ALLOWED = ["MIDWIFE", "DOCTOR"];

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles(...ALLOWED),
  PatientController.list
);
router.get("/:id", authenticate, PatientController.getOne);

router.post(
  "/",
  authenticate,
  authorizeRoles(...ALLOWED),
  PatientController.create
);
router.patch(
  "/:id",
  authenticate,
  authorizeRoles(...ALLOWED),
  PatientController.update
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(...ALLOWED),
  PatientController.delete
);
export default router;
