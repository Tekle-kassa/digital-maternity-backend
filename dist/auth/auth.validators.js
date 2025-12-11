"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstTimeChangePasswordSchema = exports.changePasswordSchema = exports.loginSchema = exports.registerSchema = exports.roleEnum = void 0;
const zod_1 = require("zod");
exports.roleEnum = zod_1.z.enum([
    "HealthWorker",
    "GBVCounselor",
    "Supervisor",
    "Admin",
]);
exports.registerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(4, "username must be at least 4 characters"),
    phone: zod_1.z.string(),
    password: zod_1.z.string().min(4, "password must be at least 4 characters"),
    // role: roleEnum,
});
exports.loginSchema = zod_1.z.object({
    phone: zod_1.z.string(),
    password: zod_1.z.string().min(4, "password must be at least 4 characters"),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: zod_1.z.string().min(4, "New password must be at least 4 characters"),
});
exports.firstTimeChangePasswordSchema = zod_1.z.object({
    phone: zod_1.z.string().min(1, "Phone is required"),
    initialPassword: zod_1.z.string().min(1, "Initial password is required"),
    newPassword: zod_1.z.string().min(4, "New password must be at least 4 characters"),
});
