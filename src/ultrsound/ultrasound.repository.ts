import prisma from "../config/prisma";

export interface CreateUltrasoundDTO {
  patientId: string;
  visitId?: string;
  takenById: string;
  imageUrl: string;
  description?: string;
  gestationalAge?: number;
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
}
