import { log } from "../common/audit.service";
import { PatientRepository } from "../patient/patient.repository";
import { AppError } from "../utils/AppError";
import { decryptField, encryptField } from "../utils/encryption";
import { CreateGBVDTO, GBVRepository, UpdateGBVDTO } from "./gbv.repository";

export class GBVService {
  static async createGBV(dto: CreateGBVDTO) {
    const patient = await PatientRepository.findById(dto.patientId);
    if (!patient) throw new AppError("Patient not found", 404);
    const allegedEncrypted = dto.allegedPerpetrator
      ? encryptField(dto.allegedPerpetrator)
      : undefined;
    const victimEncrypted = dto.victimStatement
      ? encryptField(dto.victimStatement)
      : undefined;
    const referralEncrypted = dto.referralAction
      ? encryptField(dto.referralAction)
      : undefined;
    const record = await GBVRepository.create({
      patientId: dto.patientId,
      recordedById: dto.recordedById,
      incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
      allegedPerpetratorEncrypted: allegedEncrypted,
      victimStatementEncrypted: victimEncrypted,
      referralActionEncrypted: referralEncrypted,
      attachmentUrl: dto.attachmentUrl,
      highRisk: dto.highRisk ?? false,
    });
    await log(
      dto.recordedById,
      "gbv.create",
      { reportId: record.id, patientId: dto.patientId },
      null
    );
    return { id: record.id };
  }
  static async getGBV(id: string) {
    const rec = await GBVRepository.findById(id);
    if (!rec) throw new AppError("GBV report not found", 404);

    // decrypt before returning (only for authorized role; controller will be restricted)
    const alleged = rec.allegedPerpetratorEncrypted
      ? decryptField(rec.allegedPerpetratorEncrypted)
      : null;
    const victim = rec.victimStatementEncrypted
      ? decryptField(rec.victimStatementEncrypted)
      : null;
    const referral = rec.referralActionEncrypted
      ? decryptField(rec.referralActionEncrypted)
      : null;

    await log(rec.recordedById, "gbv.read", { reportId: rec.id }, null);

    return {
      id: rec.id,
      patientId: rec.patientId,
      recordedById: rec.recordedById,
      incidentDate: rec.incidentDate,
      allegedPerpetrator: alleged,
      victimStatement: victim,
      referralAction: referral,
      attachmentUrl: rec.attachmentUrl,
      highRisk: rec.highRisk,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    };
  }
  static async listByPatient(patientId: string) {
    const list = await GBVRepository.findByPatient(patientId);
    return list.map((rec) => ({
      id: rec.id,
      patientId: rec.patientId,
      createdById: rec.recordedById,
      incidentDate: rec.incidentDate,
      // don't decrypt here unless the caller is authorized; controller will control
      hasSensitive: !!(
        rec.victimStatementEncrypted || rec.allegedPerpetratorEncrypted
      ),
      attachmentUrl: rec.attachmentUrl,
      highRisk: rec.highRisk,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    }));
  }
  static async updateGBV(id: string, updaterId: string, dto: UpdateGBVDTO) {
    const exists = await GBVRepository.findById(id);
    if (!exists) throw new AppError("GBV report not found", 404);

    const data: any = {};
    if (dto.incidentDate) data.incidentDate = new Date(dto.incidentDate);
    if (dto.allegedPerpetrator)
      data.allegedPerpetratorEncrypted = encryptField(dto.allegedPerpetrator);
    if (dto.victimStatement)
      data.victimStatementEncrypted = encryptField(dto.victimStatement);
    if (dto.referralAction)
      data.referralActionEncrypted = encryptField(dto.referralAction);
    if (dto.attachmentUrl) data.attachmentUrl = dto.attachmentUrl;
    if (typeof dto.highRisk === "boolean") data.highRisk = dto.highRisk;

    const updated = await GBVRepository.update(id, data);
    await log(updaterId, "gbv.update", { reportId: id }, null);
    return { id: updated.id };
  }
  static async deleteGBV(id: string, requesterId: string) {
    const exists = await GBVRepository.findById(id);
    if (!exists) throw new AppError("GBV report not found", 404);

    await GBVRepository.delete(id);
    await log(requesterId, "gbv.delete", { reportId: id }, null);
    return { id };
  }
}
