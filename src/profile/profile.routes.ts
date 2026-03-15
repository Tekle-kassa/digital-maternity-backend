import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/profile/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns profile for the authenticated user (name, phone, displayId, profileImageUrl, preferredLanguage, roles). Used for Profile screen.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 */
router.get("/me", authenticate, ProfileController.getMe);

/**
 * @swagger
 * /api/v1/profile/me:
 *   patch:
 *     summary: Update current user profile
 *     description: Update fullName, displayId, profileImageUrl, preferredLanguage (Settings / edit profile).
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               displayId:
 *                 type: string
 *               profileImageUrl:
 *                 type: string
 *                 format: uri
 *               preferredLanguage:
 *                 type: string
 *                 enum: [EN, SO]
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.patch("/me", authenticate, ProfileController.updateMe);

/**
 * @swagger
 * /api/v1/profile/sync-status:
 *   get:
 *     summary: Get last sync status (Synchronization)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Last sync timestamp and stats, or null if never synced
 */
router.get("/sync-status", authenticate, ProfileController.getSyncStatus);

/**
 * @swagger
 * /api/v1/profile/help:
 *   get:
 *     summary: Help and Support (contact / FAQ links)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support email, phone, FAQ URL (from env or defaults)
 */
router.get("/help", authenticate, ProfileController.getHelp);

export default router;
