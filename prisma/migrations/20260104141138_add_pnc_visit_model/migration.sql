-- CreateTable
CREATE TABLE "PNCVisit" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "recordedById" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bloodPressure" TEXT,
    "tpr" TEXT,
    "temperature" DOUBLE PRECISION,
    "uterusContracted" TEXT,
    "dribblingLeakingUrine" TEXT,
    "anemia" TEXT,
    "vaginalDischarge" TEXT,
    "breast" TEXT,
    "vitaminA" TEXT,
    "counselingDangerSigns" TEXT,
    "babyBreathing" TEXT,
    "babyBreastFeeding" TEXT,
    "babyWeightGm" DOUBLE PRECISION,
    "immunization" TEXT,
    "hivTested" TEXT,
    "hivTestResult" TEXT,
    "arvPxForMother" TEXT,
    "arvPxForNewborn" TEXT,
    "feedingOption" TEXT,
    "motherReferredToCare" TEXT,
    "newbornReferredToCare" TEXT,
    "fpCounseledAndProvided" TEXT,
    "remark" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PNCVisit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PNCVisit" ADD CONSTRAINT "PNCVisit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PNCVisit" ADD CONSTRAINT "PNCVisit_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PNCVisit" ADD CONSTRAINT "PNCVisit_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
