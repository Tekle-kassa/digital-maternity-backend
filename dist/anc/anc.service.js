"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANCService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const enums_1 = require("../../generated/prisma/enums");
class ANCService {
    static async createANCVisit(data) {
        const riskScore = data.riskScore ||
            this.computeRiskScore({
                bpSystolic: data.bpSystolic,
                bpDiastolic: data.bpDiastolic,
                weightKg: data.weightKg,
                gestationalAge: data.gestationalAge,
            });
        return prisma_1.default.aNCVisit.create({
            data: { ...data, riskScore },
            include: {
                patient: {
                    select: {
                        id: true,
                        demographics: true,
                    },
                },
                recordedBy: {
                    select: { id: true, username: true },
                },
            },
        });
    }
    static async getVisitsByPatient(patientId) {
        return prisma_1.default.aNCVisit.findMany({
            where: { patientId },
            include: {
                patient: { select: { demographics: true } },
                recordedBy: { select: { username: true } },
            },
            orderBy: { visitDate: "desc" },
        });
    }
    static async getAllVisits() {
        return prisma_1.default.aNCVisit.findMany({
            include: {
                patient: { select: { demographics: true } },
                recordedBy: { select: { username: true } },
            },
            orderBy: { visitDate: "desc" },
        });
    }
    static async updateANCVisit(visitId, updates) {
        return prisma_1.default.aNCVisit.update({
            where: { id: visitId },
            data: updates,
        });
    }
    static computeRiskScore({ bpSystolic, bpDiastolic, weightKg, gestationalAge, }) {
        if (bpSystolic > 140 || bpDiastolic > 90)
            return enums_1.RiskScore.High;
        if (weightKg < 50)
            return enums_1.RiskScore.Medium;
        if (gestationalAge < 12)
            return enums_1.RiskScore.Low;
        return enums_1.RiskScore.Medium;
    }
}
exports.ANCService = ANCService;
