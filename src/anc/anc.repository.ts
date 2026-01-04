import prisma from "../config/prisma";

export interface CreateANCRecordDTO {
  patientId: string;
  // Basic Information (cont'd)
  lmp?: Date;
  edd?: Date;
  gravida?: number;
  para?: number;
  abortion?: number;
  ectopicPreg?: number;
  childrenAlive?: number;

  // General Medical History
  diabetesMellitus?: boolean;
  cardiacDisease?: boolean;
  chronicHypertension?: boolean;
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
  heartAbnormality?: boolean;

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
  static async create(data: CreateANCRecordDTO) {
    return prisma.aNCRecord.create({
      data,
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
    return prisma.aNCRecord.update({
      where: { id },
      data,
      include: { patient: true },
    });
  }

  static async delete(id: string) {
    return prisma.aNCRecord.delete({
      where: { id },
    });
  }
}
