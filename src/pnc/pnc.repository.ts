import prisma from "../config/prisma";

export interface CreatePNCVisitDTO {
  patientId: string;
  deliveryId?: string;
  recordedById: string;

  // Consent
  clientConsentSignature?: string;
  healthProfessionalConsentSignature?: string;

  visitDate?: Date;

  // Postpartum Visit Part 1
  bloodPressure?: string;
  tpr?: string;
  temperature?: number;
  uterusContracted?: string;
  dribblingLeakingUrine?: string;

  // Postpartum Visit Part 2
  anemia?: string;
  vaginalDischarge?: string;
  breast?: string;
  vitaminA?: string;
  counselingDangerSigns?: string;

  // Postpartum Visit Part 3 - Baby
  babyBreathing?: string;
  babyBreastFeeding?: string;
  babyWeightGm?: number;
  immunization?: string;

  // Postpartum Visit Part 4 - HIV
  hivTested?: string;
  hivTestResult?: string;
  arvPxForMother?: string;
  arvPxForNewborn?: string;
  feedingOption?: string;

  // Postpartum Visit Part 5
  motherReferredToCare?: string;
  newbornReferredToCare?: string;
  fpCounseledAndProvided?: string;
  remark?: string;
  actionTaken?: string;
}

export class PNCRepository {
  static async create(data: CreatePNCVisitDTO) {
    return prisma.pNCVisit.create({
      data,
      include: {
        patient: true,
        delivery: true,
        recordedBy: true,
      },
    });
  }

  static async findById(id: string) {
    return prisma.pNCVisit.findUnique({
      where: { id },
      include: {
        patient: true,
        delivery: {
          include: {
            newborns: true,
          },
        },
        recordedBy: true,
      },
    });
  }

  static async findByPatientId(patientId: string) {
    return prisma.pNCVisit.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        delivery: true,
        recordedBy: true,
      },
    });
  }

  static async findByDeliveryId(deliveryId: string) {
    return prisma.pNCVisit.findMany({
      where: { deliveryId },
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        delivery: true,
        recordedBy: true,
      },
    });
  }

  static async update(id: string, data: Partial<CreatePNCVisitDTO>) {
    return prisma.pNCVisit.update({
      where: { id },
      data,
      include: {
        patient: true,
        delivery: true,
        recordedBy: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.pNCVisit.delete({
      where: { id },
    });
  }
}
