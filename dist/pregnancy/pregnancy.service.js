"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PregnancyService = void 0;
const AppError_1 = require("../utils/AppError");
const pregnancy_repository_1 = require("./pregnancy.repository");
class PregnancyService {
    static async createPregnancy(dto) {
        // 1. Check if patient already has active pregnancy
        const active = await pregnancy_repository_1.PregnancyRepository.findActiveByPatient(dto.patientId);
        if (active) {
            throw new AppError_1.AppError("Patient already has an active pregnancy", 400);
        }
        // Optional: auto-calculate EDD = startDate + 40 weeks
        let estimatedDue = dto.estimatedDue;
        if (!estimatedDue) {
            const due = new Date(dto.startDate);
            due.setDate(due.getDate() + 280);
            estimatedDue = due;
        }
        return pregnancy_repository_1.PregnancyRepository.create({
            patientId: dto.patientId,
            startDate: dto.startDate,
            estimatedDue,
        });
    }
    static async getPregnancy(id) {
        const p = await pregnancy_repository_1.PregnancyRepository.findById(id);
        if (!p)
            throw new AppError_1.AppError("Pregnancy not found", 404);
        return p;
    }
    static async listByPatient(patientId) {
        return pregnancy_repository_1.PregnancyRepository.listByPatient(patientId);
    }
    static async updatePregnancy(id, dto) {
        const p = await pregnancy_repository_1.PregnancyRepository.findById(id);
        if (!p)
            throw new AppError_1.AppError("Pregnancy not found", 404);
        return pregnancy_repository_1.PregnancyRepository.update(id, dto);
    }
    static async endPregnancy(id) {
        const p = await pregnancy_repository_1.PregnancyRepository.findById(id);
        if (!p)
            throw new AppError_1.AppError("Pregnancy not found", 404);
        if (!p.active)
            throw new AppError_1.AppError("Pregnancy already inactive", 400);
        return pregnancy_repository_1.PregnancyRepository.endPregnancy(id);
    }
}
exports.PregnancyService = PregnancyService;
