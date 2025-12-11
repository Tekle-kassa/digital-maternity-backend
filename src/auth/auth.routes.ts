import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/register",
  authenticate,
  authorizeRoles("ADMIN"),
  AuthController.register
);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/change-password", authenticate, AuthController.changePassword);
router.post(
  "/first-time-change-password",
  AuthController.firstTimeChangePassword
);
export default router;
