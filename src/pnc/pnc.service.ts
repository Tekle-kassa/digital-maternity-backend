import { AppError } from "../utils/AppError";
import { CreatePNCVisitDTO, PNCRepository } from "./pnc.repository";

export class PNCService {
  static async createPNCVisit(dto: CreatePNCVisitDTO) {
    // Verify patient exists
    const { default: prisma } = await import("../config/prisma");
    const patientExists = await prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patientExists) {
      throw new AppError("Patient not found", 404);
    }

    // Verify delivery exists if provided
    if (dto.deliveryId) {
      const deliveryExists = await prisma.delivery.findUnique({
        where: { id: dto.deliveryId },
      });
      if (!deliveryExists) {
        throw new AppError("Delivery not found", 404);
      }
    }

    return await PNCRepository.create(dto);
  }

  static async getPNCVisit(id: string) {
    const visit = await PNCRepository.findById(id);
    if (!visit) throw new AppError("PNC Visit not found", 404);
    return visit;
  }

  static async getPNCVisitsByPatient(patientId: string) {
    return await PNCRepository.findByPatientId(patientId);
  }

  static async getPNCVisitsByDelivery(deliveryId: string) {
    return await PNCRepository.findByDeliveryId(deliveryId);
  }

  static async updatePNCVisit(id: string, dto: Partial<CreatePNCVisitDTO>) {
    const exists = await PNCRepository.findById(id);
    if (!exists) throw new AppError("PNC Visit not found", 404);

    return await PNCRepository.update(id, dto);
  }

  static async deletePNCVisit(id: string) {
    const exists = await PNCRepository.findById(id);
    if (!exists) throw new AppError("PNC Visit not found", 404);

    return await PNCRepository.delete(id);
  }
}
