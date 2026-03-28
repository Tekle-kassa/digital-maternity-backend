import { AppError } from "../utils/AppError";
import { CreateDeliveryDTO, DeliveryRepository } from "./delivery.repository";

export class DeliveryService {
  static async createDelivery(dto: CreateDeliveryDTO) {
    // Verify patient exists
    const { default: prisma } = await import("../config/prisma");
    const patientExists = await prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patientExists) {
      throw new AppError("Patient not found", 404);
    }

    return await DeliveryRepository.create(dto);
  }

  static async getDelivery(id: string) {
    const delivery = await DeliveryRepository.findById(id);
    if (!delivery) throw new AppError("Delivery not found", 404);
    return delivery;
  }

  static async getDeliveriesByPatient(patientId: string) {
    return await DeliveryRepository.findByPatientId(patientId);
  }

  static async updateDelivery(id: string, dto: Partial<CreateDeliveryDTO>) {
    const exists = await DeliveryRepository.findById(id);
    if (!exists) throw new AppError("Delivery not found", 404);

    return await DeliveryRepository.update(id, dto);
  }

  static async deleteDelivery(id: string) {
    const exists = await DeliveryRepository.findById(id);
    if (!exists) throw new AppError("Delivery not found", 404);

    return await DeliveryRepository.delete(id);
  }
}
