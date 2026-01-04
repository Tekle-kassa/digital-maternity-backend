import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import {
  changePasswordSchema,
  firstTimeChangePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.validators";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerSchema.parse(req.body);
      const { phone, password, fullName } = parsed;
      const user = await AuthService.register({
        phone,
        password,
        fullName,
        ip: req.ip,
      });

      res.status(201).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.parse(req.body);
      const { phone, password } = parsed;
      const data = await AuthService.login({ password, phone, ip: req.ip });
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      const data = await AuthService.refresh({
        refreshToken,
        ip: req.ip,
      });

      return res.json({
        success: true,
        ...data,
      });
    } catch (err) {
      next(err);
    }
  }
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = changePasswordSchema.parse(req.body);
      const { currentPassword, newPassword } = parsed;
      const userId = (req as any).user!.userId;
      const data = await AuthService.changePassword({
        userId,
        currentPassword,
        newPassword,
        ip: req.ip,
      });
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }
  static async firstTimeChangePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsed = firstTimeChangePasswordSchema.parse(req.body);
      const { phone, initialPassword, newPassword } = parsed;
      const data = await AuthService.firstTimeChangePassword({
        phone,
        initialPassword,
        newPassword,
        ip: req.ip,
      });
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = forgotPasswordSchema.parse(req.body);
      const { phone } = parsed;
      const data = await AuthService.forgotPassword({
        phone,
        ip: req.ip,
      });
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = resetPasswordSchema.parse(req.body);
      const { phone, otpCode, newPassword } = parsed;
      const data = await AuthService.resetPassword({
        phone,
        otpCode,
        newPassword,
        ip: req.ip,
      });
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }
}
