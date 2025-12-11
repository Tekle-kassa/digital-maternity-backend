"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitService = void 0;
const patient_repository_1 = require("../patient/patient.repository");
const pregnancy_repository_1 = require("../pregnancy/pregnancy.repository");
const AppError_1 = require("../utils/AppError");
const visit_repository_1 = require("./visit.repository");
class VisitService {
    static async createVisit(dto) {
        const patient = await patient_repository_1.PatientRepository.findById(dto.patientId);
        if (!patient)
            throw new AppError_1.AppError("Patient not found", 404);
        if (dto.pregnancyId) {
            const pregnancy = await pregnancy_repository_1.PregnancyRepository.findById(dto.pregnancyId);
            if (!pregnancy)
                throw new AppError_1.AppError("Pregnancy not found", 404);
        }
        return await visit_repository_1.VisitRepository.create(dto);
    }
    static async getVisit(id) {
        const visit = await visit_repository_1.VisitRepository.findById(id);
        if (!visit)
            throw new AppError_1.AppError("Visit not found", 404);
        return visit;
    }
    static async getPatientVisits(patientId) {
        const patient = await patient_repository_1.PatientRepository.findById(patientId);
        if (!patient)
            throw new AppError_1.AppError("Patient not found", 404);
        return await visit_repository_1.VisitRepository.findByPatient(patientId);
    }
    static async updateVisit(id, dto) {
        const visit = await visit_repository_1.VisitRepository.findById(id);
        if (!visit)
            throw new AppError_1.AppError("Visit not found", 404);
        return visit_repository_1.VisitRepository.update(id, dto);
    }
    static async deleteVisit(id) {
        const visit = await visit_repository_1.VisitRepository.findById(id);
        if (!visit)
            throw new AppError_1.AppError("Visit not found", 404);
        return visit_repository_1.VisitRepository.delete(id);
    }
}
exports.VisitService = VisitService;
