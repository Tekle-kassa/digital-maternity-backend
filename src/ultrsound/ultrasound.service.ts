import prisma from "../config/prisma";
import { PatientRepository } from "../patient/patient.repository";
import { AppError } from "../utils/AppError";
import { VisitRepository } from "../visit/visit.repository";
import {
  CreateUltrasoundDTO,
  UltrasoundRepository,
} from "./ultrasound.repository";

export interface UltrasoundScanData {
  patientId: string;
  ancVisitId?: string;
  imageFilePath: string;
  scanDate: Date;
  annotations?: string;
  takenById: string;
}

export class UltrasoundService {
  static async createUltrasound(dto: CreateUltrasoundDTO) {
    const patient = await PatientRepository.findById(dto.patientId);
    if (!patient) throw new AppError("Patient not found", 404);
    if (dto.visitId) {
      const visit = await VisitRepository.findById(dto.visitId);
      if (!visit) throw new AppError("Visit not found", 404);
    }
    return UltrasoundRepository.create(dto);
  }
  static async getUltrasound(id: string) {
    const item = await UltrasoundRepository.findById(id);
    if (!item) throw new AppError("Ultrasound not found", 404);
    return item;
  }
  static async listByPatient(patientId: string) {
    const patient = await PatientRepository.findById(patientId);
    if (!patient) throw new AppError("Patient not found", 404);

    return UltrasoundRepository.findByPatient(patientId);
  }

  static async updateUltrasound(id: string, dto: Partial<CreateUltrasoundDTO>) {
    const exists = await UltrasoundRepository.findById(id);
    if (!exists) throw new AppError("Ultrasound not found", 404);

    return UltrasoundRepository.update(id, dto);
  }
  static async deleteUltrasound(id: string) {
    const exists = await UltrasoundRepository.findById(id);
    if (!exists) throw new AppError("Ultrasound not found", 404);

    return UltrasoundRepository.delete(id);
  }
}
