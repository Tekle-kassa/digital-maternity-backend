"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_controller_1 = require("./role.controller");
const router = (0, express_1.Router)();
// Only ADMIN can modify roles
router.get("/", role_controller_1.RoleController.list);
router.post("/assign", 
//   authenticate,
//   authorizeRoles("ADMIN"),
role_controller_1.RoleController.assign);
router.post("/remove", 
//   authenticate,
//   authorizeRoles("ADMIN"),
role_controller_1.RoleController.remove);
exports.default = router;
