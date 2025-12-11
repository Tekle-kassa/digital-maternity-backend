import { ReferralStatus } from "../../generated/prisma/enums";
import prisma from "../config/prisma";

export interface CreateReferralDTO {
  patientId: string;
  referredTo: string;
  reason: string;
  notes?: string; // will be encrypted
  attachmentUrl?: string; // optional S3
  createdById: string;
}

export interface UpdateReferralDTO {
  referredTo?: string;
  reason?: string;
  notes?: string;
  attachmentUrl?: string;
  status?: ReferralStatus;
}
export class ReferralRepository {
  static async create(data: CreateReferralDTO) {
    return prisma.referral.create({ data });
  }
  static async findById(id: string) {
    return prisma.referral.findUnique({ where: { id } });
  }
  static async findByPatient(patientId: string) {
    return prisma.referral.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
  }
  static async listAll() {
    return prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
  static async update(id: string, data: UpdateReferralDTO) {
    return prisma.referral.update({
      where: { id },
      data,
    });
  }
}
