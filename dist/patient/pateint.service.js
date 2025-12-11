"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientService = void 0;
const AppError_1 = require("../utils/AppError");
const patient_repository_1 = require("./patient.repository");
// import { PatientDemographics } from "../../generated/prisma/client";
class PatientService {
    static async createPatient(dto) {
        const unfpId = `UNFPA-${Date.now()}`;
        return await patient_repository_1.PatientRepository.create(dto, unfpId);
    }
    static async listPatients() {
        return await patient_repository_1.PatientRepository.findAll();
    }
    static async getPatient(id) {
        const patient = await patient_repository_1.PatientRepository.findById(id);
        if (!patient)
            throw new AppError_1.AppError("Patient not found", 404);
        return patient;
    }
    static async updatePatient(id, dto) {
        const exists = await patient_repository_1.PatientRepository.findById(id);
        if (!exists)
            throw new AppError_1.AppError("Patient not found", 404);
        return await patient_repository_1.PatientRepository.update(id, dto);
    }
    static async deletePatient(id) {
        const exists = await patient_repository_1.PatientRepository.findById(id);
        if (!exists)
            throw new AppError_1.AppError("Patient not found", 404);
        return await patient_repository_1.PatientRepository.delete(id);
    }
}
exports.PatientService = PatientService;
