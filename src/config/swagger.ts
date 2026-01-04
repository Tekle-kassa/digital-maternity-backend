import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Digital Maternity Backend API",
      version: "1.0.0",
      description:
        "Comprehensive API documentation for Digital Maternity Backend - A system for managing maternal health records, ANC visits, deliveries, PNC visits, GBV screening, and SRH registrations.",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
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
    "./src/**/*.controller.ts",
    "./src/docs/swagger-docs.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

