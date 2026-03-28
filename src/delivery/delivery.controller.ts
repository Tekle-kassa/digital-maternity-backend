import { Request, Response, NextFunction } from "express";
import { DeliveryService } from "./delivery.service";
import { AuthRequest } from "../middleware/authMiddleware";
import { deliverySchema, deliveryUpdateSchema } from "./delivery.validators";

export class DeliveryController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = deliverySchema.parse(req.body);
      const user = (req as any).user;
      const dto = { ...parsed, recordedById: user.id };
      const delivery = await DeliveryService.createDelivery(dto);
      res.status(201).json({
        success: true,
        message: "Delivery Summary recorded successfully.",
        delivery,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const delivery = await DeliveryService.getDelivery(req.params.id);
      res.json({ success: true, delivery });
    } catch (err) {
      next(err);
    }
  }

  static async getByPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const deliveries = await DeliveryService.getDeliveriesByPatient(
        req.params.patientId
      );
      res.json({ success: true, deliveries });
    } catch (err) {
      next(err);
    }
  }

  static async getByPregnancy(req: Request, res: Response, next: NextFunction) {
    try {
      const deliveries = await DeliveryService.getDeliveriesByPregnancy(
        req.params.pregnancyId
      );
      res.json({ success: true, deliveries });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = deliveryUpdateSchema.parse(req.body);
      const delivery = await DeliveryService.updateDelivery(
        req.params.id,
        parsed
      );
      res.json({ success: true, delivery });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await DeliveryService.deleteDelivery(req.params.id);
      res.json({ success: true, message: "Deleted" });
    } catch (err) {
      next(err);
    }
  }
}
