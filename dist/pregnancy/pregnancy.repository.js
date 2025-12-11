"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PregnancyRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class PregnancyRepository {
    static async create(data) {
        return prisma_1.default.pregnancy.create({ data });
    }
    static async findById(id) {
        return prisma_1.default.pregnancy.findUnique({ where: { id } });
    }
    static async findActiveByPatient(patientId) {
        return prisma_1.default.pregnancy.findFirst({
            where: { patientId, active: true },
            orderBy: { createdAt: "desc" },
        });
    }
    static async listByPatient(patientId) {
        return prisma_1.default.pregnancy.findMany({
            where: { patientId },
            orderBy: { createdAt: "desc" },
        });
    }
    static async endPregnancy(id) {
        return prisma_1.default.pregnancy.update({
            where: { id },
            data: { active: false },
        });
    }
    static async update(id, data) {
        return prisma_1.default.pregnancy.update({
            where: { id },
            data,
        });
    }
}
exports.PregnancyRepository = PregnancyRepository;
