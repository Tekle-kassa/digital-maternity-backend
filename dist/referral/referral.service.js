"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralService = void 0;
const patient_repository_1 = require("../patient/patient.repository");
const AppError_1 = require("../utils/AppError");
const referral_repository_1 = require("./referral.repository");
const encryption_1 = require("../utils/encryption");
class ReferralService {
    static async createReferral(dto) {
        const patient = await patient_repository_1.PatientRepository.findById(dto.patientId);
        if (!patient)
            throw new AppError_1.AppError("Patient not found", 404);
        const notesEncrypted = dto.notes ? (0, encryption_1.encryptField)(dto.notes) : undefined;
        const referral = await referral_repository_1.ReferralRepository.create({
            patientId: dto.patientId,
            createdById: dto.createdById,
            referredTo: dto.referredTo,
            reason: dto.reason,
            notes: notesEncrypted,
            attachmentUrl: dto.attachmentUrl,
        });
        return referral;
    }
    static async getReferral(id) {
        const ref = await referral_repository_1.ReferralRepository.findById(id);
        if (!ref)
            throw new AppError_1.AppError("Referral not found", 404);
        const notes = ref.notesEncrypted ? (0, encryption_1.decryptField)(ref.notesEncrypted) : null;
        return {
            ...ref,
            notes,
        };
    }
    static async listByPatient(patientId) {
        return referral_repository_1.ReferralRepository.findByPatient(patientId);
    }
    static async updateReferral(id, dto) {
        const ref = await referral_repository_1.ReferralRepository.findById(id);
        if (!ref)
            throw new AppError_1.AppError("Referral not found", 404);
        const updateData = { ...dto };
        if (dto.notes) {
            updateData.notesEncrypted = (0, encryption_1.encryptField)(dto.notes);
            delete updateData.notes;
        }
        return referral_repository_1.ReferralRepository.update(id, updateData);
    }
    static async changeStatus(id, status) {
        const allowed = ["INITIATED", "SENT", "RECEIVED", "COMPLETED", "CLOSED"];
        if (!allowed.includes(status))
            throw new AppError_1.AppError("Invalid status", 400);
        return referral_repository_1.ReferralRepository.update(id, { status: status });
    }
}
exports.ReferralService = ReferralService;
