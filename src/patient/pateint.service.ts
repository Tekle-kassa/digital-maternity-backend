import prisma from "../config/prisma";
import { PatientDemographics } from "../../generated/prisma/client";

export class PatientService {
  static async createPatient(
    fullName: string,
    age: number,
    createdById: string,
    locationGPS?: string,
    locationText?: string,
    photoUrl?: string
  ) {
    const unfpId = `UNFPA-${Date.now()}`;
    const patient = await prisma.patient.create({
      data: {
        unfpId,
        photoUrl,
        createdById,
        demographics: {
          create: {
            fullName,
            age,
            locationGPS,
            locationText,
          },
        },
      },
      include: { demographics: true },
    });
    return patient;
  }
  static async getPatients() {
    return prisma.patient.findMany({
      include: { demographics: true },
    });
  }
  static async getPatientById(id: string) {
    return prisma.patient.findUnique({
      where: { id },
      include: {
        demographics: true,
        ancVisits: true,
        ultrasoundScans: true,
        gbvCases: true,
      },
    });
  }
  static async updatePatient(
    id: string,
    updates: Partial<PatientDemographics>
  ) {
    return prisma.patientDemographics.update({
      where: { patientId: id },
      data: updates,
    });
  }
}
