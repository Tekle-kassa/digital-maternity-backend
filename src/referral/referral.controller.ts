import { Request, Response, NextFunction } from "express";
import { ReferralService } from "./referral.service";

export class ReferralController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const dto = {
        ...req.body,
        createdById: user.id,
        attachmentUrl: req.file ? (req.file as any).location : undefined,
      };

      const result = await ReferralService.createReferral(dto);
      res.status(201).json({ success: true, referral: result });
    } catch (err) {
      next(err);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReferralService.getReferral(req.params.id);
      res.json({ success: true, referral: result });
    } catch (err) {
      next(err);
    }
  }

  static async listByPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReferralService.listByPatient(req.params.patientId);
      res.json({ success: true, referrals: data });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updateData = {
        ...req.body,
        attachmentUrl: req.file ? (req.file as any).location : undefined,
      };

      const result = await ReferralService.updateReferral(
        req.params.id,
        updateData
      );

      res.json({ success: true, referral: result });
    } catch (err) {
      next(err);
    }
  }

  static async changeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReferralService.changeStatus(
        req.params.id,
        req.body.status
      );
      res.json({ success: true, referral: result });
    } catch (err) {
      next(err);
    }
  }
}
