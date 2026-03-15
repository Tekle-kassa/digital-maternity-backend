import prisma from "../config/prisma";

export interface CreateGBVScreeningDTO {
  patientId: string;
  recordedById: string;
  gbvReportId?: string;

  // Consent
  survivorConsentSignature?: string;
  caseWorkerConsentSignature?: string;

  // Comprehensive GBV History
  gbvHistory?: string;

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

  // Test Results
  pregnancyTestingResults?: string;
  hivTestingResults?: string;
  stiTestingResults?: string;
  postExposureProphylaxisTreatment?: string;
  emergencyContraceptiveProvision?: string;

  // Ultrasound Request
  typeOfUltrasound?: string;
  ultrasoundMore?: string;
  smartUltrasoundRecommendation?: string;

  // Treatment Plan
  treatmentPlan?: string;
  treatmentRx?: string;
  continuationSheet?: string;
}

export class GBVScreeningRepository {
  static async create(data: CreateGBVScreeningDTO) {
    return prisma.gBVScreening.create({
      data,
      include: {
        patient: true,
        recordedBy: true,
        gbvReport: true,
      },
    });
  }

  static async findById(id: string) {
    return prisma.gBVScreening.findUnique({
      where: { id },
      include: {
        patient: true,
        recordedBy: true,
        gbvReport: true,
      },
    });
  }

  static async findByPatientId(patientId: string) {
    return prisma.gBVScreening.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        recordedBy: true,
        gbvReport: true,
      },
    });
  }

  static async findByGBVReportId(gbvReportId: string) {
    return prisma.gBVScreening.findMany({
      where: { gbvReportId },
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        recordedBy: true,
        gbvReport: true,
      },
    });
  }

  static async update(id: string, data: Partial<CreateGBVScreeningDTO>) {
    return prisma.gBVScreening.update({
      where: { id },
      data,
      include: {
        patient: true,
        recordedBy: true,
        gbvReport: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.gBVScreening.delete({
      where: { id },
    });
  }
}
