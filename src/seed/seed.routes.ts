import { Router, Response, NextFunction } from "express";
import { Request } from "express";
import { authenticate, authorizeRoles, AuthRequest } from "../middleware/authMiddleware";
import config from "../config";
import { SeedService, SeedScope } from "./seed.service";
import { sendData, sendError } from "../v1/helpers";

const router = Router();

function seedAccess(req: Request, res: Response, next: NextFunction) {
  if (config.seedSecret && req.headers["x-seed-secret"] === config.seedSecret) {
    return next();
  }
  authenticate(req, res, () => {
    authorizeRoles("ADMIN")(req as AuthRequest, res, next);
  });
}

/**
 * @swagger
 * /api/v1/admin/seed:
 *   post:
 *     summary: Seed database (roles, optional demo data)
 *     description: |
 *       Requires `X-Seed-Secret` header (when SEED_SECRET is set in env) **or** Bearer JWT with ADMIN role.
 *       Body `scope`: `roles` (roles only), `demo` (demo clinic, risk rules, demo admin — needs tables), `all` (both).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Seed-Secret
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scope:
 *                 type: string
 *                 enum: [roles, demo, all]
 *                 default: roles
 *     responses:
 *       200:
 *         description: Seed result
 */
router.post(
  "/seed",
  seedAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scope = (req.body?.scope as SeedScope) || "roles";
      if (!["roles", "demo", "all"].includes(scope)) {
        return sendError(res, "VALIDATION_ERROR", "scope must be roles, demo, or all", 400);
      }
      const result = await SeedService.run(scope);
      sendData(res, { ok: true, scope, result });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
