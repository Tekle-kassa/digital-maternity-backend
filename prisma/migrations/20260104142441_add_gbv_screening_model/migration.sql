-- CreateTable
CREATE TABLE "GBVScreening" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "survivorConsentSignature" TEXT,
    "caseWorkerConsentSignature" TEXT,
    "gbvHistory" TEXT,
    "temperature" TEXT,
    "weightKg" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "bmiIndex" DOUBLE PRECISION,
    "bloodPressure" TEXT,
    "pulse" TEXT,
    "respiratoryRate" TEXT,
    "oxygenSaturation" TEXT,
    "physicalExamination" TEXT,
    "workingDiagnosis" TEXT,
    "laboratoryResults" TEXT,
    "typeOfUltrasound" TEXT,
    "smartUltrasoundRecommendation" TEXT,
    "treatmentPlan" TEXT,
    "treatmentRx" TEXT,
    "continuationSheet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gbvReportId" TEXT,

    CONSTRAINT "GBVScreening_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GBVScreening" ADD CONSTRAINT "GBVScreening_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GBVScreening" ADD CONSTRAINT "GBVScreening_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GBVScreening" ADD CONSTRAINT "GBVScreening_gbvReportId_fkey" FOREIGN KEY ("gbvReportId") REFERENCES "GBVReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
