import { AppError } from "../utils/AppError";
import { CreatePatientDTO, PatientRepository } from "./patient.repository";
// import { PatientDemographics } from "../../generated/prisma/client";

export class PatientService {
  static async createPatient(dto: CreatePatientDTO) {
    const unfpId = `UNFPA-${Date.now()}`;
    return await PatientRepository.create(dto, unfpId);
  }
  static async listPatients() {
    return await PatientRepository.findAll();
  }
  static async getPatient(id: string) {
    const patient = await PatientRepository.findById(id);
    if (!patient) throw new AppError("Patient not found", 404);
    return patient;
  }
  static async updatePatient(id: string, dto: Partial<CreatePatientDTO>) {
    const exists = await PatientRepository.findById(id);
    if (!exists) throw new AppError("Patient not found", 404);

    return await PatientRepository.update(id, dto);
  }
  static async deletePatient(id: string) {
    const exists = await PatientRepository.findById(id);
    if (!exists) throw new AppError("Patient not found", 404);

    return await PatientRepository.delete(id);
  }
}
