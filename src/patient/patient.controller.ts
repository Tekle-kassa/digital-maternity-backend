import { Request, Response, NextFunction } from "express";
import { PatientService } from "./pateint.service";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  ancBasicInformationSchema,
  patientSchema,
  registerClientSchema,
} from "./patient.validators";

export class PatientController {
  /** ANC Medical Recording — Basic Information only (patient demographics, no ANC row). */
  static async createAncBasicInformation(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsed = ancBasicInformationSchema.parse(req.body);
      const user = req.user!;
      const patient = await PatientService.createFromAncBasicInformation(
        parsed,
        user.id
      );
      res.status(201).json({
        success: true,
        message:
          "Basic information saved. Continue with the next ANC screen (e.g. consent, then ANC record).",
        patient,
        patientId: patient.id,
      });
    } catch (error) {
      next(error);
    }
  }

  /** Full Register Client flow (all UI form steps in one request). */
  static async registerClient(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsed = registerClientSchema.parse(req.body);
      const user = (req as AuthRequest).user!;
      const { patient, ancRecord } = await PatientService.registerClient(
        parsed,
        user.id
      );
      res.status(201).json({
        success: true,
        message: "ANC case registered successfully.",
        patient,
        ancRecord,
      });
    } catch (error) {
      next(error);
    }
  }

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
