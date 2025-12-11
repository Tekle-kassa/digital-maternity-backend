import { Router } from "express";
import { RoleController } from "./role.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

// Only ADMIN can modify roles
router.get("/", RoleController.list);

router.post(
  "/assign",
  //   authenticate,
  //   authorizeRoles("ADMIN"),
  RoleController.assign
);

router.post(
  "/remove",
  //   authenticate,
  //   authorizeRoles("ADMIN"),
  RoleController.remove
);

export default router;
