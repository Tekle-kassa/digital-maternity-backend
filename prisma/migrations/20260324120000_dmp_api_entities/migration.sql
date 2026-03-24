-- DMP API reference entities (API-REFERENCE.md / database-schema.sql alignment)

-- CreateEnum
CREATE TYPE "ApiClinicType" AS ENUM ('fixed', 'mobile');

-- CreateEnum
CREATE TYPE "ApiClinicStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ApiAppointmentType" AS ENUM ('prenatal_checkup', 'ultrasound', 'lab_test', 'follow_up', 'teleconsult');

-- CreateEnum
CREATE TYPE "ApiAppointmentStatus" AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'missed', 'cancelled');

-- CreateEnum
CREATE TYPE "ApiConsultPriority" AS ENUM ('routine', 'urgent', 'emergency');

-- CreateEnum
CREATE TYPE "ApiAlertType" AS ENUM ('appointment', 'risk', 'teleconsult', 'sync', 'system', 'gbv');

-- CreateEnum
CREATE TYPE "ApiAlertPriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ApiConsultationType" AS ENUM ('general', 'high_risk', 'ultrasound_review', 'gbv', 'complication');

-- CreateEnum
CREATE TYPE "ApiConsultStatus" AS ENUM ('pending', 'assigned', 'in_review', 'responded', 'closed');

-- CreateEnum
CREATE TYPE "DmpEntitySyncStatus" AS ENUM ('synced', 'pending', 'conflict');

-- CreateEnum
CREATE TYPE "SyncQueueAction" AS ENUM ('create', 'update', 'delete');

-- CreateEnum
CREATE TYPE "SyncQueueStatus" AS ENUM ('pending', 'uploading', 'downloading', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "UploadFileCategory" AS ENUM ('ultrasound', 'attachment', 'avatar', 'document');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "clinicId" TEXT,
ADD COLUMN "email" TEXT;

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "woreda" TEXT NOT NULL,
    "type" "ApiClinicType" NOT NULL,
    "status" "ApiClinicStatus" NOT NULL DEFAULT 'active',
    "patientCount" INTEGER NOT NULL DEFAULT 0,
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "ApiAppointmentType" NOT NULL,
    "visitNumber" INTEGER,
    "gestationalAgeWeeks" INTEGER,
    "gestationalAgeDays" INTEGER,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "midwifeId" TEXT NOT NULL,
    "priority" "ApiConsultPriority" NOT NULL DEFAULT 'routine',
    "status" "ApiAppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAlert" (
    "id" TEXT NOT NULL,
    "type" "ApiAlertType" NOT NULL,
    "priority" "ApiAlertPriority" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "patientId" TEXT,
    "targetUserId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeleconsultRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" "ApiConsultPriority" NOT NULL,
    "consultationType" "ApiConsultationType" NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "clinicalNotes" TEXT NOT NULL DEFAULT '',
    "assignedSpecialistId" TEXT,
    "status" "ApiConsultStatus" NOT NULL DEFAULT 'pending',
    "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeleconsultRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeleconsultAttachment" (
    "id" TEXT NOT NULL,
    "teleconsultId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeleconsultAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeleconsultResponse" (
    "id" TEXT NOT NULL,
    "teleconsultId" TEXT NOT NULL,
    "respondedById" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnosis" TEXT,
    "recommendations" TEXT NOT NULL,
    "followUpInstructions" TEXT NOT NULL,
    "prescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "TeleconsultResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "size" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "category" "UploadFileCategory" NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "smsAlerts" BOOLEAN NOT NULL DEFAULT false,
    "criticalOnly" BOOLEAN NOT NULL DEFAULT false,
    "alertAppointment" BOOLEAN NOT NULL DEFAULT true,
    "alertRisk" BOOLEAN NOT NULL DEFAULT true,
    "alertTeleconsult" BOOLEAN NOT NULL DEFAULT true,
    "alertSync" BOOLEAN NOT NULL DEFAULT true,
    "alertSystem" BOOLEAN NOT NULL DEFAULT true,
    "alertGbv" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "device" TEXT,
    "ipAddress" TEXT,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncQueueItem" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "SyncQueueAction" NOT NULL,
    "status" "SyncQueueStatus" NOT NULL DEFAULT 'pending',
    "payload" JSONB,
    "progress" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncConflict" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "localValue" TEXT NOT NULL,
    "serverValue" TEXT NOT NULL,
    "localTimestamp" TIMESTAMP(3) NOT NULL,
    "serverTimestamp" TIMESTAMP(3) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncConflict_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");
CREATE INDEX "Appointment_clinicId_idx" ON "Appointment"("clinicId");
CREATE INDEX "Appointment_scheduledDate_idx" ON "Appointment"("scheduledDate");
CREATE INDEX "UserAlert_targetUserId_idx" ON "UserAlert"("targetUserId");
CREATE INDEX "UserAlert_patientId_idx" ON "UserAlert"("patientId");
CREATE INDEX "TeleconsultRequest_patientId_idx" ON "TeleconsultRequest"("patientId");
CREATE INDEX "TeleconsultRequest_status_idx" ON "TeleconsultRequest"("status");
CREATE UNIQUE INDEX "TeleconsultResponse_teleconsultId_key" ON "TeleconsultResponse"("teleconsultId");
CREATE INDEX "UploadedFile_uploadedById_idx" ON "UploadedFile"("uploadedById");
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "SyncQueueItem_status_idx" ON "SyncQueueItem"("status");
CREATE INDEX "SyncConflict_patientId_idx" ON "SyncConflict"("patientId");
CREATE INDEX "SyncConflict_resolved_idx" ON "SyncConflict"("resolved");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_midwifeId_fkey" FOREIGN KEY ("midwifeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserAlert" ADD CONSTRAINT "UserAlert_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserAlert" ADD CONSTRAINT "UserAlert_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAlert" ADD CONSTRAINT "UserAlert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeleconsultRequest" ADD CONSTRAINT "TeleconsultRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeleconsultRequest" ADD CONSTRAINT "TeleconsultRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeleconsultRequest" ADD CONSTRAINT "TeleconsultRequest_assignedSpecialistId_fkey" FOREIGN KEY ("assignedSpecialistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeleconsultAttachment" ADD CONSTRAINT "TeleconsultAttachment_teleconsultId_fkey" FOREIGN KEY ("teleconsultId") REFERENCES "TeleconsultRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeleconsultResponse" ADD CONSTRAINT "TeleconsultResponse_teleconsultId_fkey" FOREIGN KEY ("teleconsultId") REFERENCES "TeleconsultRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeleconsultResponse" ADD CONSTRAINT "TeleconsultResponse_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SyncConflict" ADD CONSTRAINT "SyncConflict_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
