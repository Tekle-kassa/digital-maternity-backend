import { Request, Response, NextFunction } from "express";
import { VisitService } from "./visit.service";

export class VisitController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const dto = {
        ...req.body,
        recordedById: user.id,
      };

      const visit = await VisitService.createVisit(dto);

      res.status(201).json({ success: true, visit });
    } catch (err) {
      next(err);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const visit = await VisitService.getVisit(req.params.id);
      res.json({ success: true, visit });
    } catch (err) {
      next(err);
    }
  }

  static async listByPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const visits = await VisitService.getPatientVisits(req.params.patientId);
      res.json({ success: true, visits });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await VisitService.updateVisit(req.params.id, req.body);
      res.json({ success: true, visit: updated });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await VisitService.deleteVisit(req.params.id);
      res.json({ success: true, message: "Deleted" });
    } catch (err) {
      next(err);
    }
  }
}
