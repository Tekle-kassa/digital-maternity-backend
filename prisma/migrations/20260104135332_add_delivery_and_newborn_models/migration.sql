-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "pregnancyId" TEXT,
    "recordedById" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "deliveryTime" TEXT,
    "amtsl" TEXT,
    "placenta" TEXT,
    "laceration" TEXT,
    "obstetricCxManaged" BOOLEAN DEFAULT false,
    "aphManaged" BOOLEAN DEFAULT false,
    "rupturedUx" BOOLEAN DEFAULT false,
    "eclampsiaManaged" BOOLEAN DEFAULT false,
    "pphManaged" BOOLEAN DEFAULT false,
    "promSepsisManaged" BOOLEAN DEFAULT false,
    "obstPrologLaborManaged" BOOLEAN DEFAULT false,
    "hivCounsTestingOffered" TEXT,
    "hivTestingAccepted" TEXT,
    "hivTestResult" TEXT,
    "arvpxForMothers" TEXT,
    "arvpxForNb" TEXT,
    "feedingOptionEbf" TEXT,
    "rf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Newborn" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "quantity" TEXT,
    "sex" TEXT,
    "termStatus" TEXT,
    "alive" BOOLEAN DEFAULT true,
    "apgarScore" INTEGER,
    "sb" TEXT,
    "birthWeightGm" DOUBLE PRECISION,
    "lengthCm" DOUBLE PRECISION,
    "vitK" BOOLEAN DEFAULT false,
    "ttc" BOOLEAN DEFAULT false,
    "babyMotherBonding" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Newborn_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_pregnancyId_fkey" FOREIGN KEY ("pregnancyId") REFERENCES "Pregnancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Newborn" ADD CONSTRAINT "Newborn_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
