"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UltrasoundService = void 0;
const patient_repository_1 = require("../patient/patient.repository");
const AppError_1 = require("../utils/AppError");
const visit_repository_1 = require("../visit/visit.repository");
const ultrasound_repository_1 = require("./ultrasound.repository");
class UltrasoundService {
    static async createUltrasound(dto) {
        const patient = await patient_repository_1.PatientRepository.findById(dto.patientId);
        if (!patient)
            throw new AppError_1.AppError("Patient not found", 404);
        if (dto.visitId) {
            const visit = await visit_repository_1.VisitRepository.findById(dto.visitId);
            if (!visit)
                throw new AppError_1.AppError("Visit not found", 404);
        }
        return ultrasound_repository_1.UltrasoundRepository.create(dto);
    }
    static async getUltrasound(id) {
        const item = await ultrasound_repository_1.UltrasoundRepository.findById(id);
        if (!item)
            throw new AppError_1.AppError("Ultrasound not found", 404);
        return item;
    }
    static async listByPatient(patientId) {
        const patient = await patient_repository_1.PatientRepository.findById(patientId);
        if (!patient)
            throw new AppError_1.AppError("Patient not found", 404);
        return ultrasound_repository_1.UltrasoundRepository.findByPatient(patientId);
    }
    static async updateUltrasound(id, dto) {
        const exists = await ultrasound_repository_1.UltrasoundRepository.findById(id);
        if (!exists)
            throw new AppError_1.AppError("Ultrasound not found", 404);
        return ultrasound_repository_1.UltrasoundRepository.update(id, dto);
    }
    static async deleteUltrasound(id) {
        const exists = await ultrasound_repository_1.UltrasoundRepository.findById(id);
        if (!exists)
            throw new AppError_1.AppError("Ultrasound not found", 404);
        return ultrasound_repository_1.UltrasoundRepository.delete(id);
    }
}
exports.UltrasoundService = UltrasoundService;
