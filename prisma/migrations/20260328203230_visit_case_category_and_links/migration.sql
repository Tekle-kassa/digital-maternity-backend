-- CreateEnum
CREATE TYPE "VisitCaseCategory" AS ENUM ('GENERAL', 'ANC', 'PNC', 'GBV_REPORT', 'GBV_SCREENING');

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN "visitCaseCategory" "VisitCaseCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "ancRecordId" TEXT,
ADD COLUMN "pncVisitId" TEXT,
ADD COLUMN "gbvReportId" TEXT,
ADD COLUMN "gbvScreeningId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Visit_ancRecordId_key" ON "Visit"("ancRecordId");

CREATE UNIQUE INDEX "Visit_pncVisitId_key" ON "Visit"("pncVisitId");

CREATE UNIQUE INDEX "Visit_gbvReportId_key" ON "Visit"("gbvReportId");

CREATE UNIQUE INDEX "Visit_gbvScreeningId_key" ON "Visit"("gbvScreeningId");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_ancRecordId_fkey" FOREIGN KEY ("ancRecordId") REFERENCES "ANCRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Visit" ADD CONSTRAINT "Visit_pncVisitId_fkey" FOREIGN KEY ("pncVisitId") REFERENCES "PNCVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Visit" ADD CONSTRAINT "Visit_gbvReportId_fkey" FOREIGN KEY ("gbvReportId") REFERENCES "GBVReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Visit" ADD CONSTRAINT "Visit_gbvScreeningId_fkey" FOREIGN KEY ("gbvScreeningId") REFERENCES "GBVScreening"("id") ON DELETE SET NULL ON UPDATE CASCADE;
