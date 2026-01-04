-- CreateTable
CREATE TABLE "SRHRegistration" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "clientConsentSignature" TEXT,
    "healthProfessionalConsentSignature" TEXT,
    "history" TEXT,
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

    CONSTRAINT "SRHRegistration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SRHRegistration" ADD CONSTRAINT "SRHRegistration_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SRHRegistration" ADD CONSTRAINT "SRHRegistration_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
