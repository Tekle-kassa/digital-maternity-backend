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

  /** Timeline of all visits with case type and linked record ids for drill-down. */
  static async getPatientCaseVisits(patientId: string) {
    const patient = await PatientRepository.findById(patientId);
    if (!patient) throw new AppError("Patient not found", 404);

    const rows = await VisitRepository.findByPatientWithCaseLinks(patientId);
    return rows.map((v) => {
      let linkedCase:
        | { type: "ANC"; id: string }
        | { type: "PNC"; id: string }
        | { type: "GBV_REPORT"; id: string }
        | { type: "GBV_SCREENING"; id: string }
        | null = null;
      if (v.ancRecord)
        linkedCase = { type: "ANC", id: v.ancRecord.id };
      else if (v.pncVisit)
        linkedCase = { type: "PNC", id: v.pncVisit.id };
      else if (v.gbvReport)
        linkedCase = { type: "GBV_REPORT", id: v.gbvReport.id };
      else if (v.gbvScreening)
        linkedCase = { type: "GBV_SCREENING", id: v.gbvScreening.id };

      return {
        visitId: v.id,
        visitDate: v.visitDate,
        visitCaseCategory: v.visitCaseCategory,
        visitType: v.visitType,
        notes: v.notes,
        recordedBy: v.recordedBy,
        linkedCase,
      };
    });
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
