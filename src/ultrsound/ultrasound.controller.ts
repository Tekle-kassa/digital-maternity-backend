import { Request, Response, NextFunction } from "express";
import { UltrasoundService, UltrasoundScanData } from "./ultrasound.service";
import { AuthRequest } from "../middleware/authMiddleware";
import { ultrasoundSchema } from "./ultrasound.validators";
import { AppError } from "../utils/AppError";

export class UltrasoundController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!req.file) {
        throw new AppError("Image is required", 400);
      }
      const imageUrl = (req.file as any).location;
      const parsed = ultrasoundSchema.parse(req.body);
      const dto = {
        ...parsed,
        imageUrl,
        takenById: user.id,
      };
      const ultrasound = await UltrasoundService.createUltrasound(dto);

      res.status(201).json({ success: true, ultrasound });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const ultrasound = await UltrasoundService.getUltrasound(req.params.id);
      res.json({ success: true, ultrasound });
    } catch (err) {
      next(err);
    }
  }
  static async listByPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await UltrasoundService.listByPatient(req.params.patientId);
      res.json({ success: true, ultrasounds: list });
    } catch (err) {
      next(err);
    }
  }
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await UltrasoundService.updateUltrasound(
        req.params.id,
        req.body
      );
      res.json({ success: true, ultrasound: updated });
    } catch (err) {
      next(err);
    }
  }
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await UltrasoundService.deleteUltrasound(req.params.id);
      res.json({ success: true, message: "Deleted" });
    } catch (err) {
      next(err);
    }
  }
}
