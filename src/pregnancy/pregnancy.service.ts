import { AppError } from "../utils/AppError";
import {
  CreatePregnancyDTO,
  PregnancyRepository,
  UpdatePregnancyDTO,
} from "./pregnancy.repository";

export class PregnancyService {
  static async createPregnancy(dto: CreatePregnancyDTO) {
    // 1. Check if patient already has active pregnancy
    const active = await PregnancyRepository.findActiveByPatient(dto.patientId);

    if (active) {
      throw new AppError("Patient already has an active pregnancy", 400);
    }

    // Optional: auto-calculate EDD = startDate + 40 weeks
    let estimatedDue = dto.estimatedDue;
    if (!estimatedDue) {
      const due = new Date(dto.startDate);
      due.setDate(due.getDate() + 280);
      estimatedDue = due;
    }

    return PregnancyRepository.create({
      patientId: dto.patientId,
      startDate: dto.startDate,
      estimatedDue,
    });
  }

  static async getPregnancy(id: string) {
    const p = await PregnancyRepository.findById(id);
    if (!p) throw new AppError("Pregnancy not found", 404);
    return p;
  }

  static async listByPatient(patientId: string) {
    return PregnancyRepository.listByPatient(patientId);
  }

  static async updatePregnancy(id: string, dto: UpdatePregnancyDTO) {
    const p = await PregnancyRepository.findById(id);
    if (!p) throw new AppError("Pregnancy not found", 404);

    return PregnancyRepository.update(id, dto);
  }

  static async endPregnancy(id: string) {
    const p = await PregnancyRepository.findById(id);
    if (!p) throw new AppError("Pregnancy not found", 404);

    if (!p.active) throw new AppError("Pregnancy already inactive", 400);

    return PregnancyRepository.endPregnancy(id);
  }
}
