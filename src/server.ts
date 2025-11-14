import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./auth/auth.routes";
import patientRoutes from "./patient/patient.routes";
import ancRoutes from "./anc/anc.routes";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Digital Maternity Backend is running 🚀");
});
app.use("/auth", authRoutes);
app.use("/patient", patientRoutes);
app.use("/anc", ancRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
