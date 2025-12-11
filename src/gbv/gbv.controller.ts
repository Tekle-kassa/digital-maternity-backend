import { Request, Response, NextFunction } from "express";
import { GBVService } from "./gbv.service";
export class GBVController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const dto = {
        ...req.body,
        recordedById: user.id,
      };
      const result = await GBVService.createGBV(dto);
      res.status(201).json({ success: true, id: result.id });
    } catch (error) {
      next(error);
    }
  }
  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await GBVService.getGBV(req.params.id);
      res.status(200).json({ success: true, report: data });
    } catch (error) {
      next(error);
    }
  }
  static async listByPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await GBVService.listByPatient(req.params.patientId);
      res.status(200).json({ success: true, reports: list });
    } catch (error) {
      next(error);
    }
  }
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await GBVService.updateGBV(
        req.params.id,
        user.id,
        req.body
      );
      res.status(200).json({ success: true, id: result.id });
    } catch (error) {
      next(error);
    }
  }
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await GBVService.deleteGBV(req.params.id, user.id);
      res.status(200).json({ success: true, id: result.id });
    } catch (error) {
      next(error);
    }
  }
}
