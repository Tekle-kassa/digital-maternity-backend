"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class PatientRepository {
    static async create(data, unfpId) {
        return prisma_1.default.patient.create({ data: { ...data, unfpId } });
    }
    static async findById(id) {
        return prisma_1.default.patient.findUnique({ where: { id } });
    }
    static async findAll() {
        return prisma_1.default.patient.findMany({
            orderBy: { createdAt: "desc" },
        });
    }
    static async update(id, data) {
        return prisma_1.default.patient.update({
            where: { id },
            data,
        });
    }
    static async delete(id) {
        return prisma_1.default.patient.delete({ where: { id } });
    }
}
exports.PatientRepository = PatientRepository;
