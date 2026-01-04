import { AppError } from "../utils/AppError";
import { CreateANCRecordDTO, ANCRepository } from "./anc.repository";

export class ANCService {
  static async createANCRecord(dto: CreateANCRecordDTO) {
    // Verify patient exists
    const { default: prisma } = await import("../config/prisma");
    const patientExists = await prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patientExists) {
      throw new AppError("Patient not found", 404);
    }

    return await ANCRepository.create(dto);
  }

  static async getANCRecord(id: string) {
    const record = await ANCRepository.findById(id);
    if (!record) throw new AppError("ANC Record not found", 404);
    return record;
  }

  static async getANCRecordsByPatient(patientId: string) {
    return await ANCRepository.findByPatientId(patientId);
  }

  static async updateANCRecord(id: string, dto: Partial<CreateANCRecordDTO>) {
    const exists = await ANCRepository.findById(id);
    if (!exists) throw new AppError("ANC Record not found", 404);

    return await ANCRepository.update(id, dto);
  }

  static async deleteANCRecord(id: string) {
    const exists = await ANCRepository.findById(id);
    if (!exists) throw new AppError("ANC Record not found", 404);

    return await ANCRepository.delete(id);
  }
}
