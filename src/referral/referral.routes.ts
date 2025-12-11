import { Router } from "express";
import { ReferralController } from "./referral.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import { ultrasoundUpload } from "../common/multerS3";

const router = Router();

// ALLOWED: MIDWIFE, DOCTOR
const CLINICAL = ["MIDWIFE", "DOCTOR"];

router.post(
  "/",
  authenticate,
  authorizeRoles(...CLINICAL),
  ultrasoundUpload.single("attachment"),
  ReferralController.create
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles(...CLINICAL),
  ReferralController.getOne
);

router.get(
  "/patient/:patientId",
  authenticate,
  authorizeRoles(...CLINICAL),
  ReferralController.listByPatient
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles(...CLINICAL),
  ultrasoundUpload.single("attachment"),
  ReferralController.update
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles(...CLINICAL),
  ReferralController.changeStatus
);

export default router;
