import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "change_me",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "change_me_too",
    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    refreshExpiresDays: process.env.REFRESH_TOKEN_EXPIRES_DAYS
      ? Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS)
      : 30,
  },
  bcryptRounds: process.env.BCRYPT_SALT_ROUNDS
    ? Number(process.env.BCRYPT_SALT_ROUNDS)
    : 12,
  /** Optional. If set, POST /api/v1/admin/seed accepts header `X-Seed-Secret: <value>`. */
  seedSecret: process.env.SEED_SECRET || "",

  /**
   * Local facility server (offline-first): push outbox to central when online.
   * Set CENTRAL_SYNC_URL on the local deployment only.
   */
  centralSyncUrl: (process.env.CENTRAL_SYNC_URL || "").replace(/\/$/, ""),
  /** Shared secret: local sends as X-Sync-Ingest-Key; central validates with syncIngestSecret (same value). */
  centralSyncSecret: process.env.CENTRAL_SYNC_SECRET || process.env.SYNC_INGEST_SECRET || "",
  /** Stable id for this facility (e.g. clinic UUID) — sent with each batch to central. */
  facilityId: process.env.FACILITY_ID || "",
  facilityClinicId: process.env.FACILITY_CLINIC_ID || "",

  /**
   * Central server only: require this header on POST /api/v1/sync/ingest.
   * If unset, ingest is disabled (503).
   */
  syncIngestSecret: process.env.SYNC_INGEST_SECRET || process.env.CENTRAL_SYNC_SECRET || "",
};
