import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./auth/auth.routes";
import patientRoutes from "./patient/patient.routes";
import visitRoutes from "./visit/visit.routes";
import ultrasoundRoutes from "./ultrsound/ultrasound.routes";
import { globalErrorHandler } from "./middleware/errorHandler";
import roleRoutes from "./role/role.routes";
import ancRoutes from "./anc/anc.routes";
import deliveryRoutes from "./delivery/delivery.routes";
import pncRoutes from "./pnc/pnc.routes";
import gbvScreeningRoutes from "./gbv-screening/gbv-screening.routes";
import srhRoutes from "./srh/srh.routes";
import analyticsRoutes from "./analytics/analytics.routes";
import messagesRoutes from "./messages/messages.routes";
import profileRoutes from "./profile/profile.routes";
import v1ReferenceRoutes from "./v1";
import adminRoutes from "./seed/seed.routes";
import { swaggerSpec } from "./config/swagger";
import prisma from "./config/prisma";
import { connectMongoIfConfigured, isMongoConfigured } from "./config/mongo";
dotenv.config();

const app = express();
app.use(cors());
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Digital Maternity Backend is running 🚀");
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/patient", patientRoutes);
/** Prenatal visits API (same router): plural path for Postman / API-REFERENCE; singular kept for compatibility */
app.use("/api/v1/visits", visitRoutes);
app.use("/api/v1/visit", visitRoutes);
app.use("/api/v1/ultrasound", ultrasoundRoutes);
app.use("/api/v1/role", roleRoutes);
app.use("/api/v1/anc", ancRoutes);
app.use("/api/v1/delivery", deliveryRoutes);
app.use("/api/v1/pnc", pncRoutes);
app.use("/api/v1/gbv-screening", gbvScreeningRoutes);
app.use("/api/v1/srh", srhRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/messages", messagesRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1", v1ReferenceRoutes);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await prisma.$connect();
    console.log("Database connected ✓");
    if (isMongoConfigured()) {
      await connectMongoIfConfigured();
      console.log("MongoDB connected ✓");
    }
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();
