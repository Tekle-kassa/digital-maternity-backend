import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.validators";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerSchema.parse(req.body);
      const user = await AuthService.register(
        parsed.username,
        parsed.pin,
        parsed.role
      );
      res.status(201).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.parse(req.body);
      const data = await AuthService.login(parsed.username, parsed.pin);
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }
}
