import { createLinkedCaseVisit } from "../common/caseVisit";
import { AppError } from "../utils/AppError";
import prisma from "../config/prisma";
import { CreateANCRecordDTO, ANCRepository } from "./anc.repository";

export class ANCService {
  static async createANCRecord(dto: CreateANCRecordDTO, recordedById: string) {
    const patientExists = await prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patientExists) {
      throw new AppError("Patient not found", 404);
    }

    return await prisma.$transaction(async (tx) => {
      const record = await ANCRepository.createInTransaction(tx, dto);
      await createLinkedCaseVisit(tx, {
        patientId: dto.patientId,
        recordedById,
        link: { category: "ANC", ancRecordId: record.id },
      });
      return record;
    });
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
