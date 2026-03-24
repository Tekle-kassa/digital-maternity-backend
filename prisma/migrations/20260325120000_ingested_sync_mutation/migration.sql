-- Idempotent central store for local→central sync (Option B)

CREATE TABLE "IngestedSyncMutation" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "sourceQueueItemId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestedSyncMutation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IngestedSyncMutation_facilityId_sourceQueueItemId_key" ON "IngestedSyncMutation"("facilityId", "sourceQueueItemId");

CREATE INDEX "IngestedSyncMutation_facilityId_idx" ON "IngestedSyncMutation"("facilityId");

CREATE INDEX "IngestedSyncMutation_entityType_entityId_idx" ON "IngestedSyncMutation"("entityType", "entityId");
