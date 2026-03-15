-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "clientConsentSignature" TEXT,
ADD COLUMN     "deliveryAssistanceMeasures" TEXT,
ADD COLUMN     "deliveryAssistanceMore" TEXT,
ADD COLUMN     "healthProfessionalConsentSignature" TEXT,
ADD COLUMN     "referral" BOOLEAN,
ADD COLUMN     "referralInfo" TEXT;
