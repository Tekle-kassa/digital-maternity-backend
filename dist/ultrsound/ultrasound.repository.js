"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UltrasoundRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class UltrasoundRepository {
    static async create(data) {
        return prisma_1.default.ultrasound.create({ data });
    }
    static async findById(id) {
        return prisma_1.default.ultrasound.findUnique({
            where: { id },
        });
    }
    static async findByPatient(patientId) {
        return prisma_1.default.ultrasound.findMany({
            where: { patientId },
            orderBy: { createdAt: "desc" },
        });
    }
    static async update(id, data) {
        return prisma_1.default.ultrasound.update({
            where: { id },
            data,
        });
    }
    static async delete(id) {
        return prisma_1.default.ultrasound.delete({
            where: { id },
        });
    }
}
exports.UltrasoundRepository = UltrasoundRepository;
