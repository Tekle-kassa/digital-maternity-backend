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
