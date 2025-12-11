"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPatientSchema = exports.patientSchema = void 0;
const zod_1 = require("zod");
exports.patientSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(3),
    phone: zod_1.z.string().optional(),
    dob: zod_1.z.date().optional(),
    // age: z.number().min(1),
    address: zod_1.z.string().optional(),
    emergencyContact: zod_1.z.string().optional(),
});
exports.createPatientSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(3),
    phone: zod_1.z.string().optional(),
    dob: zod_1.z.date().optional(),
    // age: z.number().min(1),
    address: zod_1.z.string().optional(),
    emergencyContact: zod_1.z.string().optional(),
    createdById: zod_1.z.string(),
});
