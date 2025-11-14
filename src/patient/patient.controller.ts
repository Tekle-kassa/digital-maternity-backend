import { Request, Response, NextFunction } from "express";
import { PatientService } from "./pateint.service";
import { AuthRequest } from "../middleware/authMiddleware";
import { patientSchema } from "./patient.validators";

export class PatientController {
  static async createPatient(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsed = patientSchema.parse(req.body);
      const patient = await PatientService.createPatient(
        parsed.fullName,
        parsed.age,
        req.user!.userId,
        parsed.locationGPS,
        parsed.locationText,
        parsed.photoUrl
      );
      res.status(200).json({
        success: true,
        patient,
      });
    } catch (error) {
      next(error);
    }
  }
  static async getPatients(req: Request, res: Response, next: NextFunction) {
    try {
      const patients = await PatientService.getPatients();
      res.status(200).json({
        success: true,
        patients,
      });
    } catch (error) {
      next(error);
    }
  }
  static async getPatientById(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await PatientService.getPatientById(req.params.patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }
      res.status(200).json({
        success: true,
        patient,
      });
    } catch (error) {
      next(error);
    }
  }
  static async updatePatient(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = req.body;
      const patient = await PatientService.updatePatient(
        req.params.patientId,
        updates
      );
      res.status(200).json({
        success: true,
        patient,
      });
    } catch (error) {
      next(error);
    }
  }
}
