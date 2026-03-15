-- AlterTable
ALTER TABLE "ANCRecord" ADD COLUMN     "cardiacDiseaseMoreInfo" TEXT,
ADD COLUMN     "chestAbnormalityMoreInfo" TEXT,
ADD COLUMN     "chronicHypertensionMoreInfo" TEXT,
ADD COLUMN     "clientConsentSignature" TEXT,
ADD COLUMN     "diabetesMellitusMoreInfo" TEXT,
ADD COLUMN     "healthProfessionalConsentSignature" TEXT,
ADD COLUMN     "heartAbnormalityMoreInfo" TEXT,
ADD COLUMN     "pastObstetricHistory" JSONB;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "emergencyPhone" TEXT;
