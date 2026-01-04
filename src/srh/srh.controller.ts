import { Request, Response, NextFunction } from "express";
import { SRHService } from "./srh.service";
import { AuthRequest } from "../middleware/authMiddleware";
import { srhRegistrationSchema } from "./srh.validators";

export class SRHController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = srhRegistrationSchema.parse(req.body);
      const user = (req as any).user;
      const dto = { ...parsed, recordedById: user.id };
      const registration = await SRHService.createSRHRegistration(dto);
      res.status(201).json({
        success: true,
        registration,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await SRHService.getSRHRegistration(req.params.id);
      res.json({ success: true, registration });
    } catch (err) {
      next(err);
    }
  }

  static async getByPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const registrations = await SRHService.getSRHRegistrationsByPatient(
        req.params.patientId
      );
      res.json({ success: true, registrations });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = srhRegistrationSchema.partial().parse(req.body);
      const registration = await SRHService.updateSRHRegistration(
        req.params.id,
        parsed
      );
      res.json({ success: true, registration });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await SRHService.deleteSRHRegistration(req.params.id);
      res.json({ success: true, message: "Deleted" });
    } catch (err) {
      next(err);
    }
  }
}
