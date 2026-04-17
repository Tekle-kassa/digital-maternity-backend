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
        "**DMP resources:** `/users`, `/clinics`, `/patients`, `/visits`, `/ultrasounds`, `/gbv-reports`, `/teleconsults`, `/alerts`, `/appointments`, `/analytics`, `/sync`, `/activity`, `/settings`, `/files`, `/risk`\n\n" +
        "**Legacy aliases:** `/patient` (includes `POST /register-client` + DMP patient routes), `/visit`, `/ultrasound`, `/analytics` (merged legacy + DMP analytics).\n\n" +
        "**Facility sync:** Default central API origin is `https://api.dmp.sofoniasayele.com` (override with `CENTRAL_SYNC_URL`; paths are under `/api/v1/…`). Ingest has no auth. Optional `CENTRAL_SYNC_SECRET` / `SYNC_INGEST_SECRET` adds header `X-Sync-Ingest-Key` on outbound POSTs only.\n\n" +
        "**Mongo mirror sync:** Manual `/sync/*/push` and `/sync/*/pull` endpoints require cloud mode (`IS_CLOUD`) plus `MONGODB_URI`.\n\n" +
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
