import { Request, Response, NextFunction } from "express";
import { PatientService } from "./pateint.service";
import { AuthRequest } from "../middleware/authMiddleware";
import { patientSchema } from "./patient.validators";

export class PatientController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = patientSchema.parse(req.body);
      const user = (req as any).user;
      const dto = { ...parsed, createdById: user.id };
      const patient = await PatientService.createPatient(dto);
      res.status(200).json({
        success: true,
        patient,
      });
    } catch (error) {
      next(error);
    }
  }
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const patients = await PatientService.listPatients();
      res.json({ success: true, patients });
    } catch (err) {
      next(err);
    }
  }
  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await PatientService.getPatient(req.params.id);
      res.json({ success: true, patient });
    } catch (err) {
      next(err);
    }
  }
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await PatientService.updatePatient(
        req.params.id,
        req.body
      );
      res.json({ success: true, patient });
    } catch (err) {
      next(err);
    }
  }
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await PatientService.deletePatient(req.params.id);
      res.json({ success: true, message: "Deleted" });
    } catch (err) {
      next(err);
    }
  }
}
