import prisma from "../config/prisma";
import type { Prisma } from "../generated/prisma/client";

export interface PastObstetricEntry {
  year?: string;
  ga?: string;
  modeOfDelivery?: string;
  sex?: string;
  birthWeightKg?: number | string;
}

export interface CreateANCRecordDTO {
  patientId: string;
  // Consent
  clientConsentSignature?: string;
  healthProfessionalConsentSignature?: string;
  // Basic Information (cont'd)
  lmp?: Date;
  edd?: Date;
  gravida?: number;
  para?: number;
  abortion?: number;
  ectopicPreg?: number;
  childrenAlive?: number;

  // Past Obstetric History
  pastObstetricHistory?: PastObstetricEntry[];

  // General Medical History
  diabetesMellitus?: boolean;
  diabetesMellitusMoreInfo?: string;
  cardiacDisease?: boolean;
  cardiacDiseaseMoreInfo?: string;
  chronicHypertension?: boolean;
  chronicHypertensionMoreInfo?: string;
  otherMedicalCondition?: boolean;
  otherMedicalConditionText?: string;

  // Lab Tests
  vdrl?: string;
  hiv?: string;
  hbsAg?: string;
  rbs?: string;
  fbs?: string;
  bloodGroupRh?: string;
  ua?: string;

  // Supplement
  td?: string;

  // Initial Evaluation: General Exam
  generalExamGeneral?: string;
  generalExamPallor?: string;
  jaundice?: boolean;
  chestAbnormality?: boolean;
  chestAbnormalityMoreInfo?: string;
  heartAbnormality?: boolean;
  heartAbnormalityMoreInfo?: string;

  // Initial Evaluation: Gyn Exam
  vulvarUlcer?: boolean;
  vaginalDischarge?: boolean;
  pelvicMass?: boolean;
  cervicalLesion?: boolean;
  uterineSizeWks?: number;

  // Counseling/Testing
  dangerSignsAdvised?: boolean;
  birthPreparednessAdvised?: boolean;
  motherHivTestAccepted?: boolean;
  hivTestResult?: string;

  // HIV + Care & Follow-up
  hivTestResultReceived?: boolean;
  counseledInfantFeeding?: boolean;
  referredForCare?: boolean;
  partnerHivTestResult?: string;

  // Present Pregnancy: Follow up
  gaLmp?: string;
  complaints?: string;
  bloodPressure?: string;
  weightKg?: number;
  pallor?: string;
  hemoglobin?: string;
  uterineHeightWks?: number;
  presentation?: string;
  descent?: string;
  fetalHeartRate?: string;
  remarks?: string;
  nextFollowUpDate?: Date;
  dangerSignsIdentified?: string;
  actionAdviceCounselling?: string;
}

export class ANCRepository {
  static async createInTransaction(
    tx: Prisma.TransactionClient,
    data: CreateANCRecordDTO
  ) {
    return tx.aNCRecord.create({
      data: data as Prisma.ANCRecordUncheckedCreateInput,
      include: { patient: true },
    });
  }

  static async create(data: CreateANCRecordDTO) {
    return prisma.aNCRecord.create({
      data: data as Prisma.ANCRecordUncheckedCreateInput,
      include: { patient: true },
    });
  }

  static async findById(id: string) {
    return prisma.aNCRecord.findUnique({
      where: { id },
      include: { patient: true },
    });
  }

  static async findByPatientId(patientId: string) {
    return prisma.aNCRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: { patient: true },
    });
  }

  static async update(id: string, data: Partial<CreateANCRecordDTO>) {
    const { patientId: _omit, ...updateData } = data;
    return prisma.aNCRecord.update({
      where: { id },
      data: updateData as Prisma.ANCRecordUpdateInput,
      include: { patient: true },
    });
  }

  static async delete(id: string) {
    return prisma.aNCRecord.delete({
      where: { id },
    });
  }
}
