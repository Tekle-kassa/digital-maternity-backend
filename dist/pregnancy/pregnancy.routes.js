"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pregnancy_controller_1 = require("./pregnancy.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
const CLINICAL = ["MIDWIFE", "DOCTOR"];
// Create pregnancy
router.post("/", authMiddleware_1.authenticate, (0, authMiddleware_1.authorizeRoles)(...CLINICAL), pregnancy_controller_1.PregnancyController.create);
// Get one pregnancy
router.get("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorizeRoles)(...CLINICAL), pregnancy_controller_1.PregnancyController.getOne);
// List pregnancies for a patient
router.get("/patient/:patientId", authMiddleware_1.authenticate, (0, authMiddleware_1.authorizeRoles)(...CLINICAL), pregnancy_controller_1.PregnancyController.listByPatient);
// Update pregnancy
router.patch("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorizeRoles)(...CLINICAL), pregnancy_controller_1.PregnancyController.update);
// End pregnancy
router.post("/:id/end", authMiddleware_1.authenticate, (0, authMiddleware_1.authorizeRoles)(...CLINICAL), pregnancy_controller_1.PregnancyController.end);
exports.default = router;
