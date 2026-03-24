import { Router, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import db from "./db";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import { mapUserToApiResponse } from "./mappers";
import { sendData, sendError } from "./helpers";
import { apiRoleToDb } from "./roles";
import { RoleRepository } from "../role/role.repository";
import config from "../config";
import { AuthService } from "../auth/auth.service";
import { AppError } from "../utils/AppError";
import { z } from "zod";

const router = Router();

const createUserBody = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(4),
  role: z.string(),
  clinicId: z.string().uuid().optional(),
  avatar: z.string().optional(),
});

const updateUserBody = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  clinicId: z.string().uuid().nullable().optional(),
  avatar: z.string().optional(),
});

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List users (admin)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: UserResponse[] }"
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const users = await db.user.findMany({
        include: { roles: { include: { role: true } }, clinic: true },
        orderBy: { createdAt: "desc" },
      });
      sendData(res, users.map((u: any) => mapUserToApiResponse(u as any)));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Current user (API-REFERENCE)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: UserResponse }"
 */
router.get(
  "/me",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const u = await db.user.findUnique({
        where: { id: req.user!.id },
        include: { roles: { include: { role: true } }, clinic: true },
      });
      if (!u) return sendError(res, "NOT_FOUND", "User not found", 404);
      sendData(res, mapUserToApiResponse(u as any));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by id (admin)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: "{ data: UserResponse }"
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const u = await db.user.findUnique({
        where: { id: req.params.id },
        include: { roles: { include: { role: true } }, clinic: true },
      });
      if (!u) return sendError(res, "NOT_FOUND", "User not found", 404);
      sendData(res, mapUserToApiResponse(u as any));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create user (admin)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               role: { type: string, description: api-schema role e.g. midwife, admin }
 *               clinicId: { type: string, format: uuid }
 *               avatar: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = createUserBody.parse(req.body);
      const dbRole = apiRoleToDb(parsed.role);
      if (!dbRole) return sendError(res, "VALIDATION_ERROR", "Invalid role", 400);
      const roleRow = await RoleRepository.findOne(dbRole);
      if (!roleRow) return sendError(res, "VALIDATION_ERROR", "Role not found in system", 400);

      const passwordHash = await bcrypt.hash(parsed.password, config.bcryptRounds);
      const phone = `ref-${Date.now()}`;
      const user = await db.user.create({
        data: {
          phone,
          email: parsed.email,
          fullName: parsed.name,
          passwordHash,
          profileImageUrl: parsed.avatar,
          clinicId: parsed.clinicId,
          mustChangePassword: false,
          roles: { create: [{ roleId: roleRow.id }] },
        },
        include: { roles: { include: { role: true } }, clinic: true },
      });
      sendData(res, mapUserToApiResponse(user as any), 201);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     summary: Update user (admin)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               role: { type: string }
 *               clinicId: { type: string, nullable: true }
 *               avatar: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = updateUserBody.partial().parse(req.body);
      const existing = await db.user.findUnique({
        where: { id: req.params.id },
        include: { roles: { include: { role: true } } },
      });
      if (!existing) return sendError(res, "NOT_FOUND", "User not found", 404);

      await db.user.update({
        where: { id: req.params.id },
        data: {
          fullName: parsed.name,
          email: parsed.email,
          profileImageUrl: parsed.avatar,
          clinicId: parsed.clinicId === null ? null : parsed.clinicId,
        },
      });

      if (parsed.role) {
        const dbRole = apiRoleToDb(parsed.role);
        if (!dbRole) return sendError(res, "VALIDATION_ERROR", "Invalid role", 400);
        const roleRow = await RoleRepository.findOne(dbRole);
        if (!roleRow) return sendError(res, "VALIDATION_ERROR", "Role not found", 400);
        await db.userRole.deleteMany({ where: { userId: req.params.id } });
        await db.userRole.create({
          data: { userId: req.params.id, roleId: roleRow.id },
        });
      }

      const u = await db.user.findUnique({
        where: { id: req.params.id },
        include: { roles: { include: { role: true } }, clinic: true },
      });
      sendData(res, mapUserToApiResponse(u as any));
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/users/me/password:
 *   patch:
 *     summary: Change own password (API-REFERENCE)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 4 }
 *     responses:
 *       204:
 *         description: No content
 *       400:
 *         description: Validation
 */
router.patch(
  "/me/password",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          currentPassword: z.string(),
          newPassword: z.string().min(4),
        })
        .parse(req.body);
      await AuthService.changePassword({
        userId: req.user!.id,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
        ip: req.ip,
      });
      res.status(204).send();
    } catch (e) {
      if (e instanceof AppError && e.statusCode === 400) {
        return sendError(res, "VALIDATION_ERROR", e.message, 400);
      }
      next(e);
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Deactivate user (admin)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: No content
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await db.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
