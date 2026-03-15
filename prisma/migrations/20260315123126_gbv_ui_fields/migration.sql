-- AlterTable
ALTER TABLE "GBVReport" ADD COLUMN     "referral" BOOLEAN,
ADD COLUMN     "referralInfo" TEXT;

-- AlterTable
ALTER TABLE "GBVScreening" ADD COLUMN     "emergencyContraceptiveProvision" TEXT,
ADD COLUMN     "hivTestingResults" TEXT,
ADD COLUMN     "postExposureProphylaxisTreatment" TEXT,
ADD COLUMN     "pregnancyTestingResults" TEXT,
ADD COLUMN     "stiTestingResults" TEXT,
ADD COLUMN     "ultrasoundMore" TEXT;
