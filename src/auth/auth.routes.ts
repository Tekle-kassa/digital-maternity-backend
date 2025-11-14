import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import { Role } from "../../generated/prisma/enums";
const router = Router();

router.post(
  "/register",
  authenticate,
  authorizeRoles(Role.Admin),
  AuthController.register
);
router.post("/login", AuthController.login);

export default router;
