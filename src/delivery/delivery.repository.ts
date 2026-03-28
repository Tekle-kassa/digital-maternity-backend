import prisma from "../config/prisma";

export interface CreateNewbornDTO {
  quantity?: string; // Single, Multiple
  sex?: string; // Male, Female
  termStatus?: string; // Term, Preterm
  alive?: boolean;
  apgarScore?: number;
  sb?: string; // Mac, Fresh (Stillbirth)
  birthWeightGm?: number;
  lengthCm?: number;
  vitK?: boolean;
  ttc?: boolean;
  babyMotherBonding?: boolean;
}

export interface CreateDeliveryDTO {
  patientId: string;
  recordedById: string;

  // Consent
  clientConsentSignature?: string;
  healthProfessionalConsentSignature?: string;

  // Delivery Details
  deliveryDate?: Date;
  deliveryTime?: string;
  referral?: boolean;
  referralInfo?: string;

  // AMTSL
  amtsl?: string;

  // Placenta
  placenta?: string;

  // Laceration
  laceration?: string;

  // Management
  obstetricCxManaged?: boolean;
  aphManaged?: boolean;
  rupturedUx?: boolean;
  eclampsiaManaged?: boolean;
  pphManaged?: boolean;
  promSepsisManaged?: boolean;
  obstPrologLaborManaged?: boolean;

  // Delivery Assistance
  deliveryAssistanceMeasures?: string;
  deliveryAssistanceMore?: string;

  // HIV Details
  hivCounsTestingOffered?: string;
  hivTestingAccepted?: string;
  hivTestResult?: string;
  arvpxForMothers?: string;
  arvpxForNb?: string;
  feedingOptionEbf?: string;
  rf?: string;

  // Newborns
  newborns?: CreateNewbornDTO[];
}

export class DeliveryRepository {
  static async create(data: CreateDeliveryDTO) {
    const { newborns, ...deliveryData } = data;

    return prisma.delivery.create({
      data: {
        ...deliveryData,
        newborns: newborns
          ? {
              create: newborns,
            }
          : undefined,
      },
      include: {
        patient: true,
        pregnancy: true,
        recordedBy: true,
        newborns: true,
      },
    });
  }

  static async findById(id: string) {
    return prisma.delivery.findUnique({
      where: { id },
      include: {
        patient: true,
        pregnancy: true,
        recordedBy: true,
        newborns: true,
      },
    });
  }

  static async findByPatientId(patientId: string) {
    return prisma.delivery.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        pregnancy: true,
        recordedBy: true,
        newborns: true,
      },
    });
  }

  static async update(id: string, data: Partial<CreateDeliveryDTO>) {
    const { newborns, ...deliveryData } = data;

    // If newborns are provided, we'll need to handle them separately
    // For now, we'll just update the delivery data
    return prisma.delivery.update({
      where: { id },
      data: deliveryData,
      include: {
        patient: true,
        pregnancy: true,
        recordedBy: true,
        newborns: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.delivery.delete({
      where: { id },
    });
  }
}
