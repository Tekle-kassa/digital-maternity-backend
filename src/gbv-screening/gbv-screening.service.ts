import { AppError } from "../utils/AppError";
import {
  CreateGBVScreeningDTO,
  GBVScreeningRepository,
} from "./gbv-screening.repository";

export class GBVScreeningService {
  static async createGBVScreening(dto: CreateGBVScreeningDTO) {
    // Verify patient exists
    const { default: prisma } = await import("../config/prisma");
    const patientExists = await prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patientExists) {
      throw new AppError("Patient not found", 404);
    }

    // Verify GBV report exists if provided
    if (dto.gbvReportId) {
      const gbvReportExists = await prisma.gBVReport.findUnique({
        where: { id: dto.gbvReportId },
      });
      if (!gbvReportExists) {
        throw new AppError("GBV Report not found", 404);
      }
    }

    // Calculate BMI if weight and height are provided
    if (dto.weightKg && dto.heightCm && !dto.bmiIndex) {
      const heightInMeters = dto.heightCm / 100;
      dto.bmiIndex = dto.weightKg / (heightInMeters * heightInMeters);
    }

    return await GBVScreeningRepository.create(dto);
  }

  static async getGBVScreening(id: string) {
    const screening = await GBVScreeningRepository.findById(id);
    if (!screening) throw new AppError("GBV Screening not found", 404);
    return screening;
  }

  static async getGBVScreeningsByPatient(patientId: string) {
    return await GBVScreeningRepository.findByPatientId(patientId);
  }

  static async getGBVScreeningsByGBVReport(gbvReportId: string) {
    return await GBVScreeningRepository.findByGBVReportId(gbvReportId);
  }

  static async updateGBVScreening(
    id: string,
    dto: Partial<CreateGBVScreeningDTO>
  ) {
    const exists = await GBVScreeningRepository.findById(id);
    if (!exists) throw new AppError("GBV Screening not found", 404);

    // Recalculate BMI if weight or height changed
    if (dto.weightKg || dto.heightCm) {
      const weight = dto.weightKg ?? exists.weightKg;
      const height = dto.heightCm ?? exists.heightCm;
      if (weight && height) {
        const heightInMeters = height / 100;
        dto.bmiIndex = weight / (heightInMeters * heightInMeters);
      }
    }

    return await GBVScreeningRepository.update(id, dto);
  }

  static async deleteGBVScreening(id: string) {
    const exists = await GBVScreeningRepository.findById(id);
    if (!exists) throw new AppError("GBV Screening not found", 404);

    return await GBVScreeningRepository.delete(id);
  }
}
