import { Request, Response, NextFunction } from "express";
import { PregnancyService } from "./pregnancy.service";

export class PregnancyController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = {
        patientId: req.body.patientId,
        startDate: new Date(req.body.startDate),
        estimatedDue: req.body.estimatedDue
          ? new Date(req.body.estimatedDue)
          : undefined,
      };

      const pregnancy = await PregnancyService.createPregnancy(dto);
      res.status(201).json({ success: true, pregnancy });
    } catch (err) {
      next(err);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const pregnancy = await PregnancyService.getPregnancy(req.params.id);
      res.json({ success: true, pregnancy });
    } catch (err) {
      next(err);
    }
  }

  static async listByPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const pregnancies = await PregnancyService.listByPatient(
        req.params.patientId
      );
      res.json({ success: true, pregnancies });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const pregnancy = await PregnancyService.updatePregnancy(
        req.params.id,
        req.body
      );

      res.json({ success: true, pregnancy });
    } catch (err) {
      next(err);
    }
  }

  static async end(req: Request, res: Response, next: NextFunction) {
    try {
      const pregnancy = await PregnancyService.endPregnancy(req.params.id);
      res.json({ success: true, pregnancy });
    } catch (err) {
      next(err);
    }
  }
}
