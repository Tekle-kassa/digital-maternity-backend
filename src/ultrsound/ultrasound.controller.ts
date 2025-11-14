import { Request, Response, NextFunction } from "express";
import { UltrasoundService, UltrasoundScanData } from "./ultrasound.service";
import { AuthRequest } from "../middleware/authMiddleware";
import { ultrasoundSchema } from "./ultrasound.validators";

export class UltrasoundController {
  static async createScan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = ultrasoundSchema.parse(req.body);
      const scan: UltrasoundScanData = {
        ...parsed,
        takenById: req.user!.userId,
        scanDate: new Date(parsed.scanDate),
      };
      const created = await UltrasoundService.createScan(scan);
      res.status(201).json({ success: true, scan: created });
    } catch (error) {
      next(error);
    }
  }

  static async getScansByPatient(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const scans = await UltrasoundService.getScansByPatient(
        req.params.patientId
      );
      res.status(200).json({ success: true, scans });
    } catch (error) {
      next(error);
    }
  }

  static async updateScan(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = req.body; // optionally validate annotations only
      const updated = await UltrasoundService.updateScan(
        req.params.scanId,
        updates
      );
      res.status(200).json({ success: true, scan: updated });
    } catch (error) {
      next(error);
    }
  }
}
