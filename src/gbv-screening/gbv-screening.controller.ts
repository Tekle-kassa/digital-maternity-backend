import { Request, Response, NextFunction } from "express";
import { GBVScreeningService } from "./gbv-screening.service";
import { AuthRequest } from "../middleware/authMiddleware";
import { gbvScreeningSchema } from "./gbv-screening.validators";

export class GBVScreeningController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = gbvScreeningSchema.parse(req.body);
      const user = (req as any).user;
      const dto = { ...parsed, recordedById: user.id };
      const screening = await GBVScreeningService.createGBVScreening(dto);
      res.status(201).json({
        success: true,
        screening,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const screening = await GBVScreeningService.getGBVScreening(
        req.params.id
      );
      res.json({ success: true, screening });
    } catch (err) {
      next(err);
    }
  }

  static async getByPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const screenings = await GBVScreeningService.getGBVScreeningsByPatient(
        req.params.patientId
      );
      res.json({ success: true, screenings });
    } catch (err) {
      next(err);
    }
  }

  static async getByGBVReport(req: Request, res: Response, next: NextFunction) {
    try {
      const screenings = await GBVScreeningService.getGBVScreeningsByGBVReport(
        req.params.gbvReportId
      );
      res.json({ success: true, screenings });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = gbvScreeningSchema.partial().parse(req.body);
      const screening = await GBVScreeningService.updateGBVScreening(
        req.params.id,
        parsed
      );
      res.json({ success: true, screening });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await GBVScreeningService.deleteGBVScreening(req.params.id);
      res.json({ success: true, message: "Deleted" });
    } catch (err) {
      next(err);
    }
  }
}
