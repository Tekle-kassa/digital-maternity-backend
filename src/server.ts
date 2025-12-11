import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./auth/auth.routes";
import patientRoutes from "./patient/patient.routes";
import visitRoutes from "./visit/visit.routes";
import ultrasoundRoutes from "./ultrsound/ultrasound.routes";
import { globalErrorHandler } from "./middleware/errorHandler";
import roleRoutes from "./role/role.routes";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Digital Maternity Backend is running 🚀");
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/patient", patientRoutes);
app.use("/api/v1/visit", visitRoutes);
app.use("/api/v1/ultrasound", ultrasoundRoutes);
app.use("/api/v1/role", roleRoutes);
app.use(globalErrorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
