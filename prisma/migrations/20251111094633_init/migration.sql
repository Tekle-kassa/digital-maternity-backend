-- CreateEnum
CREATE TYPE "Role" AS ENUM ('HealthWorker', 'GBVCounselor', 'Supervisor', 'Admin');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'SO');

-- CreateEnum
CREATE TYPE "RiskScore" AS ENUM ('Low', 'Medium', 'High');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('Requested', 'InProgress', 'Completed');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('Success', 'Failed', 'Partial');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "languagePreference" "Language" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "unfpId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientDemographics" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "locationGPS" TEXT,
    "locationText" TEXT,

    CONSTRAINT "PatientDemographics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ANCVisit" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "gestationalAge" INTEGER NOT NULL,
    "bpSystolic" INTEGER NOT NULL,
    "bpDiastolic" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "riskScore" "RiskScore" NOT NULL,
    "healthWorkerNotes" TEXT,
    "recordedById" TEXT NOT NULL,

    CONSTRAINT "ANCVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UltrasoundScan" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "ancVisitId" TEXT,
    "imageFilePath" TEXT NOT NULL,
    "scanDate" TIMESTAMP(3) NOT NULL,
    "annotations" TEXT,
    "takenById" TEXT NOT NULL,

    CONSTRAINT "UltrasoundScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GBVCase" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "dateOfIncident" TIMESTAMP(3) NOT NULL,
    "servicesProvided" TEXT NOT NULL,
    "referralMade" BOOLEAN NOT NULL,
    "referralService" TEXT,
    "recordedById" TEXT NOT NULL,

    CONSTRAINT "GBVCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestingUserId" TEXT NOT NULL,
    "specialistUserId" TEXT NOT NULL,
    "status" "ConsultationStatus" NOT NULL,
    "chatLog" TEXT,
    "consultationDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "syncTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordsPushed" INTEGER NOT NULL,
    "recordsPulled" INTEGER NOT NULL,
    "status" "SyncStatus" NOT NULL,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_unfpId_key" ON "Patient"("unfpId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientDemographics_patientId_key" ON "PatientDemographics"("patientId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDemographics" ADD CONSTRAINT "PatientDemographics_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ANCVisit" ADD CONSTRAINT "ANCVisit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ANCVisit" ADD CONSTRAINT "ANCVisit_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UltrasoundScan" ADD CONSTRAINT "UltrasoundScan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UltrasoundScan" ADD CONSTRAINT "UltrasoundScan_ancVisitId_fkey" FOREIGN KEY ("ancVisitId") REFERENCES "ANCVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UltrasoundScan" ADD CONSTRAINT "UltrasoundScan_takenById_fkey" FOREIGN KEY ("takenById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GBVCase" ADD CONSTRAINT "GBVCase_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GBVCase" ADD CONSTRAINT "GBVCase_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_specialistUserId_fkey" FOREIGN KEY ("specialistUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
