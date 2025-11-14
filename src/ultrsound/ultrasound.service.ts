import prisma from "../config/prisma";

export interface UltrasoundScanData {
  patientId: string;
  ancVisitId?: string;
  imageFilePath: string;
  scanDate: Date;
  annotations?: string;
  takenById: string;
}

export class UltrasoundService {
  static async createScan(data: UltrasoundScanData) {
    return prisma.ultrasoundScan.create({
      data,
      include: {
        patient: { select: { id: true, demographics: true } },
        takenBy: { select: { id: true, username: true } },
      },
    });
  }
  static async getScansByPatient(patientId: string) {
    return prisma.ultrasoundScan.findMany({
      where: { patientId },
      include: {
        patient: { select: { demographics: true } },
        takenBy: { select: { username: true } },
      },
      orderBy: { scanDate: "desc" },
    });
  }

  static async updateScan(
    scanId: string,
    updates: Partial<UltrasoundScanData>
  ) {
    return prisma.ultrasoundScan.update({
      where: { id: scanId },
      data: updates,
    });
  }
}
