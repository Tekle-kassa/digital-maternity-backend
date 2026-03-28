import prisma from "../config/prisma";
import type { Prisma } from "../generated/prisma/client";

export interface CreateGBVDTO {
  patientId: string;
  recordedById: string;
  incidentDate?: string; // ISO
  allegedPerpetrator?: string;
  victimStatement?: string;
  referralAction?: string;
  referral?: boolean; // Referral Yes/No (Basic Information)
  referralInfo?: string; // Insert Referral Info (optional)
  attachmentUrl?: string;
  highRisk?: boolean;
}
export interface UpdateGBVDTO {
  incidentDate?: string;
  allegedPerpetrator?: string;
  victimStatement?: string;
  referralAction?: string;
  referral?: boolean;
  referralInfo?: string;
  attachmentUrl?: string;
  highRisk?: boolean;
}
export class GBVRepository {
  static async createInTransaction(
    tx: Prisma.TransactionClient,
    data: {
      patientId: string;
      recordedById: string;
      incidentDate?: Date | null;
      allegedPerpetratorEncrypted?: string | null;
      victimStatementEncrypted?: string | null;
      referralActionEncrypted?: string | null;
      referral?: boolean | null;
      referralInfo?: string | null;
      attachmentUrl?: string | null;
      highRisk?: boolean;
    }
  ) {
    return tx.gBVReport.create({
      data: {
        patientId: data.patientId,
        recordedById: data.recordedById,
        incidentDate: data.incidentDate ?? null,
        allegedPerpetratorEncrypted: data.allegedPerpetratorEncrypted ?? null,
        victimStatementEncrypted: data.victimStatementEncrypted ?? null,
        referralActionEncrypted: data.referralActionEncrypted ?? null,
        referral: data.referral ?? null,
        referralInfo: data.referralInfo ?? null,
        attachmentUrl: data.attachmentUrl ?? null,
        highRisk: data.highRisk ?? false,
      },
    });
  }

  static async create(data: {
    patientId: string;
    recordedById: string;
    incidentDate?: Date | null;
    allegedPerpetratorEncrypted?: string | null;
    victimStatementEncrypted?: string | null;
    referralActionEncrypted?: string | null;
    referral?: boolean | null;
    referralInfo?: string | null;
    attachmentUrl?: string | null;
    highRisk?: boolean;
  }) {
    return prisma.gBVReport.create({
      data: {
        patientId: data.patientId,
        recordedById: data.recordedById,
        incidentDate: data.incidentDate ?? null,
        allegedPerpetratorEncrypted: data.allegedPerpetratorEncrypted ?? null,
        victimStatementEncrypted: data.victimStatementEncrypted ?? null,
        referralActionEncrypted: data.referralActionEncrypted ?? null,
        referral: data.referral ?? null,
        referralInfo: data.referralInfo ?? null,
        attachmentUrl: data.attachmentUrl ?? null,
        highRisk: data.highRisk ?? false,
      },
    });
  }

  static async findById(id: string) {
    return prisma.gBVReport.findUnique({ where: { id } });
  }

  static async findByPatient(patientId: string) {
    return prisma.gBVReport.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async update(
    id: string,
    data: UpdateGBVDTO & {
      allegedPerpetratorEncrypted?: string;
      victimStatementEncrypted?: string;
      referralActionEncrypted?: string;
    }
  ) {
    return prisma.gBVReport.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.gBVReport.delete({ where: { id } });
  }
}
