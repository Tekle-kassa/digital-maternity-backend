"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GBVRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class GBVRepository {
    static async create(data) {
        return prisma_1.default.gBVReport.create({
            data: {
                patientId: data.patientId,
                recordedById: data.recordedById,
                incidentDate: data.incidentDate ?? null,
                allegedPerpetratorEncrypted: data.allegedPerpetratorEncrypted ?? null,
                victimStatementEncrypted: data.victimStatementEncrypted ?? null,
                referralActionEncrypted: data.referralActionEncrypted ?? null,
                attachmentUrl: data.attachmentUrl ?? null,
                highRisk: data.highRisk ?? false,
            },
        });
    }
    static async findById(id) {
        return prisma_1.default.gBVReport.findUnique({ where: { id } });
    }
    static async findByPatient(patientId) {
        return prisma_1.default.gBVReport.findMany({
            where: { patientId },
            orderBy: { createdAt: "desc" },
        });
    }
    static async update(id, data) {
        return prisma_1.default.gBVReport.update({
            where: { id },
            data,
        });
    }
    static async delete(id) {
        return prisma_1.default.gBVReport.delete({ where: { id } });
    }
}
exports.GBVRepository = GBVRepository;
