import { Router } from "express";
import { RoleController } from "./role.controller";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/role:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     security: []
 *     responses:
 *       200:
 *         description: List of roles
 */
// Only ADMIN can modify roles
router.get("/", RoleController.list);

/**
 * @swagger
 * /api/v1/role/assign:
 *   post:
 *     summary: Assign role to user
 *     tags: [Roles]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               roleId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Role assigned successfully
 */
router.post(
  "/assign",
  //   authenticate,
  //   authorizeRoles("ADMIN"),
  RoleController.assign
);

/**
 * @swagger
 * /api/v1/role/remove:
 *   post:
 *     summary: Remove role from user
 *     tags: [Roles]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               roleId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Role removed successfully
 */
router.post(
  "/remove",
  //   authenticate,
  //   authorizeRoles("ADMIN"),
  RoleController.remove
);

export default router;
