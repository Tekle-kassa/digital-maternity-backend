import { Request, Response, NextFunction } from "express";
import { PNCService } from "./pnc.service";
import { AuthRequest } from "../middleware/authMiddleware";
import { pncVisitSchema } from "./pnc.validators";

export class PNCController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = pncVisitSchema.parse(req.body);
      const user = (req as any).user;
      const dto = { ...parsed, recordedById: user.id };
      const visit = await PNCService.createPNCVisit(dto);
      res.status(201).json({
        success: true,
        visit,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const visit = await PNCService.getPNCVisit(req.params.id);
      res.json({ success: true, visit });
    } catch (err) {
      next(err);
    }
  }

  static async getByPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const visits = await PNCService.getPNCVisitsByPatient(
        req.params.patientId
      );
      res.json({ success: true, visits });
    } catch (err) {
      next(err);
    }
  }

  static async getByDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const visits = await PNCService.getPNCVisitsByDelivery(
        req.params.deliveryId
      );
      res.json({ success: true, visits });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = pncVisitSchema.partial().parse(req.body);
      const visit = await PNCService.updatePNCVisit(req.params.id, parsed);
      res.json({ success: true, visit });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await PNCService.deletePNCVisit(req.params.id);
      res.json({ success: true, message: "Deleted" });
    } catch (err) {
      next(err);
    }
  }
}
