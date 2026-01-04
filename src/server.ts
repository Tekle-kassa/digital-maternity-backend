import express from "express";
import cors from "cors";
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
import { swaggerSpec } from "./config/swagger";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Digital Maternity Backend is running 🚀");
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/patient", patientRoutes);
app.use("/api/v1/visit", visitRoutes);
app.use("/api/v1/ultrasound", ultrasoundRoutes);
app.use("/api/v1/role", roleRoutes);
app.use("/api/v1/anc", ancRoutes);
app.use("/api/v1/delivery", deliveryRoutes);
app.use("/api/v1/pnc", pncRoutes);
app.use("/api/v1/gbv-screening", gbvScreeningRoutes);
app.use("/api/v1/srh", srhRoutes);
app.use(globalErrorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
