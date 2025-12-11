import prisma from "../config/prisma";
export interface CreatePatientDTO {
  //   unfpId: string;
  fullName: string;
  phone?: string;
  dob?: Date;
  address?: string;
  emergencyContact?: string;
  createdById: string;
}

export class PatientRepository {
  static async create(data: CreatePatientDTO, unfpId: string) {
    return prisma.patient.create({ data: { ...data, unfpId } });
  }
  static async findById(id: string) {
    return prisma.patient.findUnique({ where: { id } });
  }
  static async findAll() {
    return prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
  static async update(id: string, data: Partial<CreatePatientDTO>) {
    return prisma.patient.update({
      where: { id },
      data,
    });
  }
  static async delete(id: string) {
    return prisma.patient.delete({ where: { id } });
  }
}
