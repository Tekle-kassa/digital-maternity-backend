import { Response, NextFunction } from "express";
import { ProfileService } from "./profile.service";
import { AuthRequest } from "../middleware/authMiddleware";
import { updateProfileSchema } from "./profile.validators";

export class ProfileController {
  /** GET /me – get current user profile. */
  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const profile = await ProfileService.getProfile(userId);
      res.json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /me – update current user profile. */
  static async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const parsed = updateProfileSchema.parse(req.body);
      const profile = await ProfileService.updateProfile(userId, parsed);
      res.json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  }

  /** GET /sync-status – last sync info (Synchronization menu). */
  static async getSyncStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const syncStatus = await ProfileService.getSyncStatus(userId);
      res.json({ success: true, syncStatus });
    } catch (err) {
      next(err);
    }
  }

  /** GET /help – Help and Support (link/contact info; can be extended). */
  static async getHelp(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        help: {
          supportEmail: process.env.SUPPORT_EMAIL ?? "support@example.com",
          supportPhone: process.env.SUPPORT_PHONE ?? null,
          faqUrl: process.env.HELP_FAQ_URL ?? null,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
