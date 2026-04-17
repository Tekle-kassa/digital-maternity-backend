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
   * Local facility: central API origin only (no trailing slash, no `/api` suffix — client adds `/api/v1/sync/ingest`).
   * Default: production cloud API.
   */
  centralSyncUrl: (
    process.env.CENTRAL_SYNC_URL || "https://api.dmp.sofoniasayele.com"
  ).replace(/\/$/, ""),
  /** Optional. If set, outbound POST /ingest includes header X-Sync-Ingest-Key. */
  centralSyncSecret:
    process.env.CENTRAL_SYNC_SECRET || process.env.SYNC_INGEST_SECRET || "",
  /** Stable id for this facility (e.g. clinic UUID) — sent with each batch to central. */
  facilityId: process.env.FACILITY_ID || "asdasd",
  facilityClinicId: process.env.FACILITY_CLINIC_ID || "",
  /** Optional FK for `SyncLog` rows created by entity-row cron (defaults to oldest user). */
  syncCronActingUserId: process.env.SYNC_CRON_ACTING_USER_ID || "",
  /** Cloud mode gate for Mongo sync APIs/connections. */
  isCloud: Boolean(process.env.IS_CLOUD || process.env.isCloud),
  /** Optional MongoDB connection string for Prisma -> Mongo sync mirror APIs. */
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || "",
};
