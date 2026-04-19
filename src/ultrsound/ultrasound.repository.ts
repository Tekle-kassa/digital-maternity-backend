import prisma from "../config/prisma";
import { UltrasoundReviewStatus } from "../generated/prisma/client";

export interface CreateUltrasoundDTO {
  patientId: string;
  visitId?: string;
  takenById: string;
  imageUrl: string;
  description?: string;
  gestationalAge?: number;
  /** Client device capture time (ISO parsed). */
  capturedAt?: Date;
  gain?: number;
  depth?: number;
  dynamicRange?: number;
}

export class UltrasoundRepository {
  static async create(data: CreateUltrasoundDTO) {
    return prisma.ultrasound.create({ data });
  }

  static async findById(id: string) {
    return prisma.ultrasound.findUnique({
      where: { id },
    });
  }

  static async findByPatient(patientId: string) {
    return prisma.ultrasound.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async update(id: string, data: Partial<CreateUltrasoundDTO>) {
    return prisma.ultrasound.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.ultrasound.delete({
      where: { id },
    });
  }

  static async setReviewApproved(id: string, reviewerId: string) {
    return prisma.ultrasound.update({
      where: { id },
      data: {
        reviewStatus: UltrasoundReviewStatus.APPROVED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });
  }

  static async setAnnotations(id: string, annotations: string) {
    return prisma.ultrasound.update({
      where: { id },
      data: { annotations },
    });
  }
}
