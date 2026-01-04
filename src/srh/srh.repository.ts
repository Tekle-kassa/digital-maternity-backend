import prisma from "../config/prisma";

export interface CreateSRHRegistrationDTO {
  patientId: string;
  recordedById: string;

  // Consent
  clientConsentSignature?: string;
  healthProfessionalConsentSignature?: string;

  // History
  history?: string;

  // Vital Signs
  temperature?: string;
  weightKg?: number;
  heightCm?: number;
  bmiIndex?: number;
  bloodPressure?: string;
  pulse?: string;
  respiratoryRate?: string;
  oxygenSaturation?: string;

  // Physical Examination
  physicalExamination?: string;

  // Working Diagnosis
  workingDiagnosis?: string;

  // Laboratory
  laboratoryResults?: string;

  // Ultrasound Request
  typeOfUltrasound?: string;
  smartUltrasoundRecommendation?: string;

  // Treatment Plan
  treatmentPlan?: string;
  treatmentRx?: string;
  continuationSheet?: string;
}

export class SRHRepository {
  static async create(data: CreateSRHRegistrationDTO) {
    return prisma.sRHRegistration.create({
      data,
      include: {
        patient: true,
        recordedBy: true,
      },
    });
  }

  static async findById(id: string) {
    return prisma.sRHRegistration.findUnique({
      where: { id },
      include: {
        patient: true,
        recordedBy: true,
      },
    });
  }

  static async findByPatientId(patientId: string) {
    return prisma.sRHRegistration.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        recordedBy: true,
      },
    });
  }

  static async update(id: string, data: Partial<CreateSRHRegistrationDTO>) {
    return prisma.sRHRegistration.update({
      where: { id },
      data,
      include: {
        patient: true,
        recordedBy: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.sRHRegistration.delete({
      where: { id },
    });
  }
}
