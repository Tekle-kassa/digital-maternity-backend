import prisma from "../config/prisma";

export interface CreatePregnancyDTO {
  patientId: string;
  startDate: Date;
  estimatedDue?: Date;
}

export interface UpdatePregnancyDTO {
  startDate?: Date;
  estimatedDue?: Date;
  active?: boolean;
}
export class PregnancyRepository {
  static async create(data: CreatePregnancyDTO) {
    return prisma.pregnancy.create({ data });
  }

  static async findById(id: string) {
    return prisma.pregnancy.findUnique({ where: { id } });
  }

  static async findActiveByPatient(patientId: string) {
    return prisma.pregnancy.findFirst({
      where: { patientId, active: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listByPatient(patientId: string) {
    return prisma.pregnancy.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async endPregnancy(id: string) {
    return prisma.pregnancy.update({
      where: { id },
      data: { active: false },
    });
  }

  static async update(id: string, data: UpdatePregnancyDTO) {
    return prisma.pregnancy.update({
      where: { id },
      data,
    });
  }
}
