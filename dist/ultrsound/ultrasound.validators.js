"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ultrasoundSchema = void 0;
const zod_1 = require("zod");
exports.ultrasoundSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    visitId: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().nonempty(),
    annotations: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    gestationalAge: zod_1.z.number().optional(),
});
