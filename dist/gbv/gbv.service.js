"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GBVService = void 0;
const audit_service_1 = require("../common/audit.service");
const patient_repository_1 = require("../patient/patient.repository");
const AppError_1 = require("../utils/AppError");
const encryption_1 = require("../utils/encryption");
const gbv_repository_1 = require("./gbv.repository");
class GBVService {
    static async createGBV(dto) {
        const patient = await patient_repository_1.PatientRepository.findById(dto.patientId);
        if (!patient)
            throw new AppError_1.AppError("Patient not found", 404);
        const allegedEncrypted = dto.allegedPerpetrator
            ? (0, encryption_1.encryptField)(dto.allegedPerpetrator)
            : undefined;
        const victimEncrypted = dto.victimStatement
            ? (0, encryption_1.encryptField)(dto.victimStatement)
            : undefined;
        const referralEncrypted = dto.referralAction
            ? (0, encryption_1.encryptField)(dto.referralAction)
            : undefined;
        const record = await gbv_repository_1.GBVRepository.create({
            patientId: dto.patientId,
            recordedById: dto.recordedById,
            incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
            allegedPerpetratorEncrypted: allegedEncrypted,
            victimStatementEncrypted: victimEncrypted,
            referralActionEncrypted: referralEncrypted,
            attachmentUrl: dto.attachmentUrl,
            highRisk: dto.highRisk ?? false,
        });
        await (0, audit_service_1.log)(dto.recordedById, "gbv.create", { reportId: record.id, patientId: dto.patientId }, null);
        return { id: record.id };
    }
    static async getGBV(id) {
        const rec = await gbv_repository_1.GBVRepository.findById(id);
        if (!rec)
            throw new AppError_1.AppError("GBV report not found", 404);
        // decrypt before returning (only for authorized role; controller will be restricted)
        const alleged = rec.allegedPerpetratorEncrypted
            ? (0, encryption_1.decryptField)(rec.allegedPerpetratorEncrypted)
            : null;
        const victim = rec.victimStatementEncrypted
            ? (0, encryption_1.decryptField)(rec.victimStatementEncrypted)
            : null;
        const referral = rec.referralActionEncrypted
            ? (0, encryption_1.decryptField)(rec.referralActionEncrypted)
            : null;
        await (0, audit_service_1.log)(rec.recordedById, "gbv.read", { reportId: rec.id }, null);
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
    static async listByPatient(patientId) {
        const list = await gbv_repository_1.GBVRepository.findByPatient(patientId);
        return list.map((rec) => ({
            id: rec.id,
            patientId: rec.patientId,
            createdById: rec.recordedById,
            incidentDate: rec.incidentDate,
            // don't decrypt here unless the caller is authorized; controller will control
            hasSensitive: !!(rec.victimStatementEncrypted || rec.allegedPerpetratorEncrypted),
            attachmentUrl: rec.attachmentUrl,
            highRisk: rec.highRisk,
            createdAt: rec.createdAt,
            updatedAt: rec.updatedAt,
        }));
    }
    static async updateGBV(id, updaterId, dto) {
        const exists = await gbv_repository_1.GBVRepository.findById(id);
        if (!exists)
            throw new AppError_1.AppError("GBV report not found", 404);
        const data = {};
        if (dto.incidentDate)
            data.incidentDate = new Date(dto.incidentDate);
        if (dto.allegedPerpetrator)
            data.allegedPerpetratorEncrypted = (0, encryption_1.encryptField)(dto.allegedPerpetrator);
        if (dto.victimStatement)
            data.victimStatementEncrypted = (0, encryption_1.encryptField)(dto.victimStatement);
        if (dto.referralAction)
            data.referralActionEncrypted = (0, encryption_1.encryptField)(dto.referralAction);
        if (dto.attachmentUrl)
            data.attachmentUrl = dto.attachmentUrl;
        if (typeof dto.highRisk === "boolean")
            data.highRisk = dto.highRisk;
        const updated = await gbv_repository_1.GBVRepository.update(id, data);
        await (0, audit_service_1.log)(updaterId, "gbv.update", { reportId: id }, null);
        return { id: updated.id };
    }
    static async deleteGBV(id, requesterId) {
        const exists = await gbv_repository_1.GBVRepository.findById(id);
        if (!exists)
            throw new AppError_1.AppError("GBV report not found", 404);
        await gbv_repository_1.GBVRepository.delete(id);
        await (0, audit_service_1.log)(requesterId, "gbv.delete", { reportId: id }, null);
        return { id };
    }
}
exports.GBVService = GBVService;
