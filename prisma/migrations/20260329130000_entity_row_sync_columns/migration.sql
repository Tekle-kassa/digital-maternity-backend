-- Row-level sync metadata for local → central cron (DmpEntitySyncStatus).

ALTER TABLE "User" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "User" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "syncError" TEXT;
UPDATE "User" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "Patient" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Patient" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "Patient" ADD COLUMN "syncError" TEXT;
UPDATE "Patient" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "Visit" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Visit" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "Visit" ADD COLUMN "syncError" TEXT;
UPDATE "Visit" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "Ultrasound" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Ultrasound" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "Ultrasound" ADD COLUMN "syncError" TEXT;
UPDATE "Ultrasound" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "GBVReport" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "GBVReport" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "GBVReport" ADD COLUMN "syncError" TEXT;
UPDATE "GBVReport" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "GBVScreening" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "GBVScreening" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "GBVScreening" ADD COLUMN "syncError" TEXT;
UPDATE "GBVScreening" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "SRHRegistration" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "SRHRegistration" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "SRHRegistration" ADD COLUMN "syncError" TEXT;
UPDATE "SRHRegistration" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "Referral" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Referral" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "Referral" ADD COLUMN "syncError" TEXT;
UPDATE "Referral" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "Pregnancy" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Pregnancy" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "Pregnancy" ADD COLUMN "syncError" TEXT;
UPDATE "Pregnancy" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "ANCRecord" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "ANCRecord" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "ANCRecord" ADD COLUMN "syncError" TEXT;
UPDATE "ANCRecord" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "Delivery" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Delivery" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "Delivery" ADD COLUMN "syncError" TEXT;
UPDATE "Delivery" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "Newborn" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Newborn" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "Newborn" ADD COLUMN "syncError" TEXT;
UPDATE "Newborn" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "PNCVisit" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "PNCVisit" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "PNCVisit" ADD COLUMN "syncError" TEXT;
UPDATE "PNCVisit" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "Conversation" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Conversation" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN "syncError" TEXT;
UPDATE "Conversation" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "Message" ADD COLUMN "syncStatus" "DmpEntitySyncStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Message" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN "syncError" TEXT;
UPDATE "Message" SET "syncStatus" = 'synced', "syncedAt" = NOW() WHERE true;

ALTER TABLE "TeleconsultRequest" ADD COLUMN "syncedAt" TIMESTAMP(3);
ALTER TABLE "TeleconsultRequest" ADD COLUMN "syncError" TEXT;
UPDATE "TeleconsultRequest" SET "syncedAt" = NOW() WHERE "syncStatus" = 'synced';
