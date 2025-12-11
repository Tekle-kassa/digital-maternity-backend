import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import { ultrasoundUpload } from "../common/multerS3";
import { GBVController } from "./gbv.controller";
const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("MIDWIFE", "GBV_OFFICER"),
  ultrasoundUpload.single("attachment"),
  GBVController.create
);
router.get(
  "/patient/:patientId",
  authenticate,
  authorizeRoles("MIDWIFE", "GBV_OFFICER"),
  GBVController.listByPatient
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("MIDWIFE", "GBV_OFFICER"),
  GBVController.getOne
);
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("MIDWIFE", "GBV_OFFICER"),
  GBVController.update
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("MIDWIFE", "GBV_OFFICER"),
  GBVController.delete
);
export default router;
