import prisma from "../config/prisma";

export interface CreateVisitDTO {
  patientId: string;
  pregnancyId?: string;
  recordedById: string;

  gestationalAge?: number;
  bloodPressure?: string;
  temperature?: number;
  weight?: number;
  symptoms?: string;
  notes?: string;
  visitNumber?: number;
  visitType?: string;
}
export class VisitRepository {
  static async create(data: CreateVisitDTO) {
    return prisma.visit.create({ data: { ...data, visitDate: new Date() } });
  }
  static async findById(id: string) {
    return prisma.visit.findUnique({ where: { id } });
  }
  static async findByPatient(patientId: string) {
    return prisma.visit.findMany({
      where: { patientId },
      orderBy: { visitDate: "desc" },
    });
  }

  /** Visits with case links for clinical timelines (ANC / PNC / GBV). */
  static async findByPatientWithCaseLinks(patientId: string) {
    return prisma.visit.findMany({
      where: { patientId },
      orderBy: { visitDate: "desc" },
      include: {
        recordedBy: {
          select: { id: true, fullName: true, phone: true },
        },
        ancRecord: { select: { id: true, createdAt: true } },
        pncVisit: { select: { id: true, visitDate: true } },
        gbvReport: {
          select: { id: true, createdAt: true, highRisk: true },
        },
        gbvScreening: { select: { id: true, createdAt: true } },
      },
    });
  }
  static async update(id: string, data: Partial<CreateVisitDTO>) {
    return prisma.visit.update({
      where: { id },
      data,
    });
  }
  static async delete(id: string) {
    return prisma.visit.delete({
      where: { id },
    });
  }
}
