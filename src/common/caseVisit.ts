import type { Prisma } from "../generated/prisma/client";
import { VisitCaseCategory as VisitCaseCategoryEnum } from "../generated/prisma/enums";

const TYPE_LABEL: Record<
  (typeof VisitCaseCategoryEnum)[keyof typeof VisitCaseCategoryEnum],
  string
> = {
  [VisitCaseCategoryEnum.GENERAL]: "General visit",
  [VisitCaseCategoryEnum.ANC]: "ANC",
  [VisitCaseCategoryEnum.PNC]: "PNC",
  [VisitCaseCategoryEnum.GBV_REPORT]: "GBV report",
  [VisitCaseCategoryEnum.GBV_SCREENING]: "GBV screening",
};

export type CaseVisitLink =
  | { category: "ANC"; ancRecordId: string }
  | { category: "PNC"; pncVisitId: string }
  | { category: "GBV_REPORT"; gbvReportId: string }
  | { category: "GBV_SCREENING"; gbvScreeningId: string };

/**
 * Creates a Visit row linked to a clinical case (ANC / PNC / GBV) for patient timelines.
 * Call inside the same transaction as the case create.
 */
export async function createLinkedCaseVisit(
  tx: Prisma.TransactionClient,
  input: {
    patientId: string;
    recordedById: string;
    visitDate?: Date;
    notes?: string;
    link: CaseVisitLink;
  }
): Promise<{ id: string }> {
  const visitDate = input.visitDate ?? new Date();
  const { link } = input;
  const visitCaseCategory =
    VisitCaseCategoryEnum[link.category as keyof typeof VisitCaseCategoryEnum];

  const base = {
    patientId: input.patientId,
    recordedById: input.recordedById,
    visitDate,
    visitCaseCategory,
    visitType: TYPE_LABEL[visitCaseCategory],
    notes: input.notes ?? null,
  };

  if (link.category === "ANC") {
    return tx.visit.create({
      data: { ...base, ancRecordId: link.ancRecordId },
      select: { id: true },
    });
  }
  if (link.category === "PNC") {
    return tx.visit.create({
      data: { ...base, pncVisitId: link.pncVisitId },
      select: { id: true },
    });
  }
  if (link.category === "GBV_REPORT") {
    return tx.visit.create({
      data: { ...base, gbvReportId: link.gbvReportId },
      select: { id: true },
    });
  }
  return tx.visit.create({
    data: { ...base, gbvScreeningId: link.gbvScreeningId },
    select: { id: true },
  });
}
