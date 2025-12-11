"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class VisitRepository {
    static async create(data) {
        return prisma_1.default.visit.create({ data: { ...data, visitDate: new Date() } });
    }
    static async findById(id) {
        return prisma_1.default.visit.findUnique({ where: { id } });
    }
    static async findByPatient(patientId) {
        return prisma_1.default.visit.findMany({
            where: { patientId },
            orderBy: { visitDate: "desc" },
        });
    }
    static async update(id, data) {
        return prisma_1.default.visit.update({
            where: { id },
            data,
        });
    }
    static async delete(id) {
        return prisma_1.default.visit.delete({
            where: { id },
        });
    }
}
exports.VisitRepository = VisitRepository;
