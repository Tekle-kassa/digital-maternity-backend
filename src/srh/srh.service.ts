import { AppError } from "../utils/AppError";
import { CreateSRHRegistrationDTO, SRHRepository } from "./srh.repository";

export class SRHService {
  static async createSRHRegistration(dto: CreateSRHRegistrationDTO) {
    // Verify patient exists
    const { default: prisma } = await import("../config/prisma");
    const patientExists = await prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patientExists) {
      throw new AppError("Patient not found", 404);
    }

    // Calculate BMI if weight and height are provided
    if (dto.weightKg && dto.heightCm && !dto.bmiIndex) {
      const heightInMeters = dto.heightCm / 100;
      dto.bmiIndex = dto.weightKg / (heightInMeters * heightInMeters);
    }

    return await SRHRepository.create(dto);
  }

  static async getSRHRegistration(id: string) {
    const registration = await SRHRepository.findById(id);
    if (!registration) throw new AppError("SRH Registration not found", 404);
    return registration;
  }

  static async getSRHRegistrationsByPatient(patientId: string) {
    return await SRHRepository.findByPatientId(patientId);
  }

  static async updateSRHRegistration(
    id: string,
    dto: Partial<CreateSRHRegistrationDTO>
  ) {
    const exists = await SRHRepository.findById(id);
    if (!exists) throw new AppError("SRH Registration not found", 404);

    // Recalculate BMI if weight or height changed
    if (dto.weightKg || dto.heightCm) {
      const weight = dto.weightKg ?? exists.weightKg;
      const height = dto.heightCm ?? exists.heightCm;
      if (weight && height) {
        const heightInMeters = height / 100;
        dto.bmiIndex = weight / (heightInMeters * heightInMeters);
      }
    }

    return await SRHRepository.update(id, dto);
  }

  static async deleteSRHRegistration(id: string) {
    const exists = await SRHRepository.findById(id);
    if (!exists) throw new AppError("SRH Registration not found", 404);

    return await SRHRepository.delete(id);
  }
}
