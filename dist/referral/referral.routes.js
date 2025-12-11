"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const referral_controller_1 = require("./referral.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const multerS3_1 = require("../common/multerS3");
const router = (0, express_1.Router)();
// ALLOWED: MIDWIFE, DOCTOR
const CLINICAL = ["MIDWIFE", "DOCTOR"];
router.post("/", authMiddleware_1.authenticate, (0, authMiddleware_1.authorizeRoles)(...CLINICAL), multerS3_1.ultrasoundUpload.single("attachment"), referral_controller_1.ReferralController.create);
router.get("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorizeRoles)(...CLINICAL), referral_controller_1.ReferralController.getOne);
router.get("/patient/:patientId", authMiddleware_1.authenticate, (0, authMiddleware_1.authorizeRoles)(...CLINICAL), referral_controller_1.ReferralController.listByPatient);
router.patch("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorizeRoles)(...CLINICAL), multerS3_1.ultrasoundUpload.single("attachment"), referral_controller_1.ReferralController.update);
router.patch("/:id/status", authMiddleware_1.authenticate, (0, authMiddleware_1.authorizeRoles)(...CLINICAL), referral_controller_1.ReferralController.changeStatus);
exports.default = router;
