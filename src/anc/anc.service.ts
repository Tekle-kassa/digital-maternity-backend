import prisma from "../config/prisma";
import { RiskScore } from "../../generated/prisma/enums";

interface ANCVisitData {
  patientId: string;
  visitDate: Date;
  gestationalAge: number;
  bpSystolic: number;
  bpDiastolic: number;
  weightKg: number;
  riskScore: RiskScore;
  healthWorkerNotes?: string;
  recordedById: string;
}
interface RiskScoreFactors {
  bpSystolic: number;
  bpDiastolic: number;
  weightKg: number;
  gestationalAge: number;
}
export class ANCService {
  static async createANCVisit(data: ANCVisitData) {
    const riskScore =
      data.riskScore ||
      this.computeRiskScore({
        bpSystolic: data.bpSystolic,
        bpDiastolic: data.bpDiastolic,
        weightKg: data.weightKg,
        gestationalAge: data.gestationalAge,
      });
    return prisma.aNCVisit.create({
      data: { ...data, riskScore },
      include: {
        patient: {
          select: {
            id: true,
            demographics: true,
          },
        },
        recordedBy: {
          select: { id: true, username: true },
        },
      },
    });
  }
  static async getVisitsByPatient(patientId: string) {
    return prisma.aNCVisit.findMany({
      where: { patientId },
      include: {
        patient: { select: { demographics: true } },
        recordedBy: { select: { username: true } },
      },
      orderBy: { visitDate: "desc" },
    });
  }
  static async getAllVisits() {
    return prisma.aNCVisit.findMany({
      include: {
        patient: { select: { demographics: true } },
        recordedBy: { select: { username: true } },
      },
      orderBy: { visitDate: "desc" },
    });
  }

  static async updateANCVisit(visitId: string, updates: Partial<ANCVisitData>) {
    return prisma.aNCVisit.update({
      where: { id: visitId },
      data: updates,
    });
  }
  static computeRiskScore({
    bpSystolic,
    bpDiastolic,
    weightKg,
    gestationalAge,
  }: RiskScoreFactors): RiskScore {
    if (bpSystolic > 140 || bpDiastolic > 90) return RiskScore.High;
    if (weightKg < 50) return RiskScore.Medium;
    if (gestationalAge < 12) return RiskScore.Low;
    return RiskScore.Medium;
  }
}
