import { PatientRepository } from "../patient/patient.repository";
import { PregnancyRepository } from "../pregnancy/pregnancy.repository";
import { AppError } from "../utils/AppError";
import { CreateVisitDTO, VisitRepository } from "./visit.repository";

export class VisitService {
  static async createVisit(dto: CreateVisitDTO) {
    const patient = await PatientRepository.findById(dto.patientId);
    if (!patient) throw new AppError("Patient not found", 404);
    if (dto.pregnancyId) {
      const pregnancy = await PregnancyRepository.findById(dto.pregnancyId);
      if (!pregnancy) throw new AppError("Pregnancy not found", 404);
    }
    return await VisitRepository.create(dto);
  }
  static async getVisit(id: string) {
    const visit = await VisitRepository.findById(id);
    if (!visit) throw new AppError("Visit not found", 404);
    return visit;
  }
  static async getPatientVisits(patientId: string) {
    const patient = await PatientRepository.findById(patientId);
    if (!patient) throw new AppError("Patient not found", 404);

    return await VisitRepository.findByPatient(patientId);
  }
  static async updateVisit(id: string, dto: Partial<CreateVisitDTO>) {
    const visit = await VisitRepository.findById(id);
    if (!visit) throw new AppError("Visit not found", 404);

    return VisitRepository.update(id, dto);
  }
  static async deleteVisit(id: string) {
    const visit = await VisitRepository.findById(id);
    if (!visit) throw new AppError("Visit not found", 404);

    return VisitRepository.delete(id);
  }
}
