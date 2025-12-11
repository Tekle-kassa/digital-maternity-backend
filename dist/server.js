"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const patient_routes_1 = __importDefault(require("./patient/patient.routes"));
const visit_routes_1 = __importDefault(require("./visit/visit.routes"));
const ultrasound_routes_1 = __importDefault(require("./ultrsound/ultrasound.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const role_routes_1 = __importDefault(require("./role/role.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Digital Maternity Backend is running 🚀");
});
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/patient", patient_routes_1.default);
app.use("/api/v1/visit", visit_routes_1.default);
app.use("/api/v1/ultrasound", ultrasound_routes_1.default);
app.use("/api/v1/role", role_routes_1.default);
app.use(errorHandler_1.globalErrorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
