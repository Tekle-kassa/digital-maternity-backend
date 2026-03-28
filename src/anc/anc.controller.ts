import { Request, Response, NextFunction } from "express";
import { ANCService } from "./anc.service";
import { AuthRequest } from "../middleware/authMiddleware";
import { ancRecordSchema } from "./anc.validators";

export class ANCController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = ancRecordSchema.parse(req.body);
      const record = await ANCService.createANCRecord(parsed);
      res.status(201).json({
        success: true,
        message: "ANC Case have been registered successfully.",
        record,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await ANCService.getANCRecord(req.params.id);
      res.json({ success: true, record });
    } catch (err) {
      next(err);
    }
  }

  static async getByPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await ANCService.getANCRecordsByPatient(
        req.params.patientId
      );
      res.json({ success: true, records });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ancRecordSchema.partial().parse(req.body);
      const record = await ANCService.updateANCRecord(req.params.id, parsed);
      res.json({ success: true, record });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ANCService.deleteANCRecord(req.params.id);
      res.json({ success: true, message: "Deleted" });
    } catch (err) {
      next(err);
    }
  }
}
