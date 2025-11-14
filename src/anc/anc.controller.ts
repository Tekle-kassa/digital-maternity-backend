import { Response, NextFunction } from "express";
import { ANCService } from "./anc.service";
import { AuthRequest } from "../middleware/authMiddleware";
import { ancVisitSchema } from "./anc.validators";

export class ANCController {
  static async createANCVisit(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsed = ancVisitSchema.parse(req.body);
      const visit = await ANCService.createANCVisit({
        ...parsed,
        visitDate: new Date(parsed.visitDate),
        recordedById: req.user!.userId,
      });

      res.status(201).json({ success: true, visit });
    } catch (err) {
      next(err);
    }
  }

  static async getVisitsByPatient(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const visits = await ANCService.getVisitsByPatient(req.params.patientId);
      res.json({ success: true, visits });
    } catch (err) {
      next(err);
    }
  }

  static async getAllVisits(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const visits = await ANCService.getAllVisits();
      res.json({ success: true, visits });
    } catch (err) {
      next(err);
    }
  }

  static async updateANCVisit(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const visit = await ANCService.updateANCVisit(
        req.params.visitId,
        req.body
      );
      res.json({ success: true, visit });
    } catch (err) {
      next(err);
    }
  }
}
