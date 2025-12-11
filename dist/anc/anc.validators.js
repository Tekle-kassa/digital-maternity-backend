"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ancVisitSchema = void 0;
const zod_1 = require("zod");
exports.ancVisitSchema = zod_1.z.object({
    patientId: zod_1.z.string().uuid(),
    visitDate: zod_1.z.string().datetime(),
    gestationalAge: zod_1.z.number().min(1).max(42),
    bpSystolic: zod_1.z.number().min(50).max(250),
    bpDiastolic: zod_1.z.number().min(30).max(150),
    weightKg: zod_1.z.number().positive(),
    riskScore: zod_1.z.enum(["Low", "Medium", "High"]),
    healthWorkerNotes: zod_1.z.string().optional(),
});
