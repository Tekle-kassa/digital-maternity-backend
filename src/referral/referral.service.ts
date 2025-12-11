import { PatientRepository } from "../patient/patient.repository";
import { AppError } from "../utils/AppError";
import {
  CreateReferralDTO,
  ReferralRepository,
  UpdateReferralDTO,
} from "./referral.repository";
import { decryptField, encryptField } from "../utils/encryption";
import { ReferralStatus } from "../../generated/prisma/enums";

export class ReferralService {
  static async createReferral(dto: CreateReferralDTO) {
    const patient = await PatientRepository.findById(dto.patientId);
    if (!patient) throw new AppError("Patient not found", 404);
    const notesEncrypted = dto.notes ? encryptField(dto.notes) : undefined;
    const referral = await ReferralRepository.create({
      patientId: dto.patientId,
      createdById: dto.createdById,
      referredTo: dto.referredTo,
      reason: dto.reason,
      notes: notesEncrypted,
      attachmentUrl: dto.attachmentUrl,
    });
    return referral;
  }
  static async getReferral(id: string) {
    const ref = await ReferralRepository.findById(id);
    if (!ref) throw new AppError("Referral not found", 404);

    const notes = ref.notesEncrypted ? decryptField(ref.notesEncrypted) : null;

    return {
      ...ref,
      notes,
    };
  }
  static async listByPatient(patientId: string) {
    return ReferralRepository.findByPatient(patientId);
  }
  static async updateReferral(id: string, dto: UpdateReferralDTO) {
    const ref = await ReferralRepository.findById(id);
    if (!ref) throw new AppError("Referral not found", 404);

    const updateData: any = { ...dto };

    if (dto.notes) {
      updateData.notesEncrypted = encryptField(dto.notes);
      delete updateData.notes;
    }

    return ReferralRepository.update(id, updateData);
  }
  static async changeStatus(id: string, status: string) {
    const allowed = ["INITIATED", "SENT", "RECEIVED", "COMPLETED", "CLOSED"];
    if (!allowed.includes(status)) throw new AppError("Invalid status", 400);

    return ReferralRepository.update(id, { status: status as ReferralStatus });
  }
}
