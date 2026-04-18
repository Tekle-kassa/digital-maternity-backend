import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Digital Maternity Backend API",
      version: "1.0.0",
      description:
        "UNFPA Digital Maternity Package (DMP) — REST API per `API-REFERENCE.md` + legacy modules (ANC register-client, delivery, PNC, etc.).\n\n" +
        "**Base path:** `/api/v1`\n\n" +
        "**DMP resources:** `/users`, `/clinics`, `/patients`, `/visits`, `/ultrasounds`, `/gbv-reports`, `/teleconsults`, `/alerts`, `/appointments`, `/analytics`, `/sync`, `/mongo`, `/activity`, `/settings`, `/files`, `/risk`\n\n" +
        "**Legacy aliases:** `/patient` (includes `POST /register-client` + DMP patient routes), `/visit`, `/ultrasound`, `/analytics` (merged legacy + DMP analytics).\n\n" +
        "**Facility sync:** Default central API origin is `https://api.dmp.sofoniasayele.com` (override with `CENTRAL_SYNC_URL`; paths are under `/api/v1/…`). Ingest has no auth. Optional `CENTRAL_SYNC_SECRET` / `SYNC_INGEST_SECRET` adds header `X-Sync-Ingest-Key` on outbound POSTs only.\n\n" +
        "**Mongo mirror:** `GET/POST /mongo/…` — JWT; requires `MONGODB_URI` / `IS_CLOUD` for data access. Manual `/sync/*/summary` and `/sync/*/pull` under `/api/v1/sync` require the same for pull.\n\n" +
        '**Seeding:** `POST /api/v1/admin/seed` with `X-Seed-Secret` (if `SEED_SECRET` is set) or ADMIN JWT. Body: `{ "scope": "roles" | "demo" | "all" }`.',
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:4008",
        description: "Development server",
      },
      {
        url: "https://api.example.com",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Sync",
        description:
          "Facility ↔ central sync. `POST /sync/ingest` receives batches (no auth). Local pushes via JWT or cron; default central host is configurable.",
      },
      {
        name: "Mongo",
        description:
          "MongoDB mirror under `/api/v1/mongo`. Each entity has its own paths (e.g. `GET /mongo/Patient`, `GET /mongo/Patient/{id}`) — no generic `/:entityType` route. Filters on list: any query key except `page`, `limit`, `sort`, `order` is equality-matched; use `field_gte` / `field_lte` with ISO dates for ranges. Lists return `data` + `meta`.",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
      },
      parameters: {
        MongoListPage: {
          name: "page",
          in: "query",
          description: "1-based page index",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        MongoListLimit: {
          name: "limit",
          in: "query",
          description: "Page size",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
        MongoListSort: {
          name: "sort",
          in: "query",
          description: "Mongo field to sort by",
          schema: { type: "string", default: "updatedAt" },
        },
        MongoListOrder: {
          name: "order",
          in: "query",
          description: "Sort direction",
          schema: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
          },
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
          },
        },
        Patient: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            fullName: { type: "string" },
            unfpId: { type: "string" },
            cardNo: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            email: { type: "string", nullable: true },
            age: { type: "integer", nullable: true },
            address: { type: "string", nullable: true },
            subCity: { type: "string", nullable: true },
            woreda: { type: "string", nullable: true },
            kebele: { type: "string", nullable: true },
            houseNo: { type: "string", nullable: true },
            facility: { type: "string", nullable: true },
            maritalStatus: { type: "string", nullable: true },
            idNumber: { type: "string", nullable: true },
            emergencyContact: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            phone: { type: "string" },
            fullName: { type: "string", nullable: true },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        DmpListResponse: {
          type: "object",
          description: "Standard DMP list envelope (API-REFERENCE.md)",
          properties: {
            data: { type: "array", items: {} },
            meta: {
              type: "object",
              properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                totalPages: { type: "integer" },
              },
            },
          },
        },
        DmpDataResponse: {
          type: "object",
          properties: {
            data: {},
          },
        },
        DmpError: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { type: "object", additionalProperties: true },
              },
            },
          },
        },
        PrismaSyncEntityName: {
          type: "string",
          description: "Prisma model name for mirrored Mongo collection",
          enum: [
            "Patient",
            "Visit",
            "Ultrasound",
            "GBVReport",
            "GBVScreening",
            "SRHRegistration",
            "ANCRecord",
            "Delivery",
            "PNCVisit",
            "Pregnancy",
            "Referral",
            "Message",
            "Conversation",
            "User",
            "Role",
            "UserRole",
          ],
        },
        MongoEntitiesResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/PrismaSyncEntityName" },
            },
          },
        },
        MongoSyncEntityResult: {
          type: "object",
          properties: {
            entityType: { $ref: "#/components/schemas/PrismaSyncEntityName" },
            totalFromPrisma: { type: "integer" },
            upserted: { type: "integer" },
            deleted: { type: "integer" },
          },
        },
        MongoSyncAllResponse: {
          type: "object",
          properties: {
            syncedAt: { type: "string", format: "date-time" },
            results: {
              type: "array",
              items: { $ref: "#/components/schemas/MongoSyncEntityResult" },
            },
          },
        },
        MongoSyncSingleResponse: {
          type: "object",
          properties: {
            syncedAt: { type: "string", format: "date-time" },
            entityType: { $ref: "#/components/schemas/PrismaSyncEntityName" },
            totalFromPrisma: { type: "integer" },
            upserted: { type: "integer" },
            deleted: { type: "integer" },
          },
        },
        SyncIngestItem: {
          type: "object",
          required: ["id", "entityType", "entityId", "action"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Idempotent key from the local outbox (queue item id or generated UUID).",
            },
            entityType: {
              type: "string",
              description: "Prisma model name, e.g. Patient, Visit.",
            },
            entityId: { type: "string" },
            action: { type: "string", example: "create" },
            payload: { description: "Entity snapshot or mutation payload", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        SyncIngestBatchRequest: {
          type: "object",
          required: ["facilityId", "items"],
          properties: {
            facilityId: { type: "string", description: "Local `FACILITY_ID`" },
            clinicId: { type: "string" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/SyncIngestItem" },
            },
          },
        },
        SyncIngestSuccessData: {
          type: "object",
          properties: {
            accepted: { type: "integer", description: "New mutations stored on central" },
            duplicates: {
              type: "integer",
              description: "Skipped (same facilityId + source queue id already ingested)",
            },
          },
        },
        SyncCronSlug: {
          type: "string",
          enum: [
            "patients",
            "users",
            "visits",
            "ultrasounds",
            "gbv-reports",
            "gbv-screenings",
            "srh-registrations",
            "referrals",
            "pregnancies",
            "anc-records",
            "deliveries",
            "newborns",
            "pnc-visits",
            "conversations",
            "messages",
            "teleconsult-requests",
          ],
          description: "URL segment; response includes matching `entityType` (Prisma model name).",
        },
        SyncCronSummaryData: {
          type: "object",
          properties: {
            entityType: { type: "string", example: "Patient" },
            slug: { $ref: "#/components/schemas/SyncCronSlug" },
            pending: { type: "integer" },
            synced: { type: "integer" },
            conflict: { type: "integer" },
            maxPendingChangeAt: { type: "string", format: "date-time", nullable: true },
            maxTableChangeAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        SyncCronPushSuccessData: {
          type: "object",
          properties: {
            entityType: { type: "string" },
            slug: { type: "string" },
            itemCount: { type: "integer" },
            entityTypesTouched: { type: "array", items: { type: "string" } },
            central: {
              type: "object",
              properties: {
                accepted: { type: "integer" },
                duplicates: { type: "integer" },
              },
            },
            error: { type: "string", description: "Present when push failed (HTTP 400)" },
          },
        },
        SyncEnqueueBody: {
          type: "object",
          required: ["entityType", "entityId", "action"],
          properties: {
            entityType: { type: "string" },
            entityId: { type: "string", format: "uuid" },
            action: { type: "string", enum: ["create", "update", "delete"] },
            payload: {},
          },
        },
        SyncTriggerSuccessData: {
          type: "object",
          properties: {
            pushed: { type: "integer" },
            accepted: { type: "integer" },
            duplicates: { type: "integer" },
            message: { type: "string" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/**/*.routes.ts",
    "./src/**/*.router.ts",
    "./src/**/*.controller.ts",
    "./src/docs/swagger-docs.ts",
    "./src/docs/openapi-dmp.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
