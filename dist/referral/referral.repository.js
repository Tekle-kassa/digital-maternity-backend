"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class ReferralRepository {
    static async create(data) {
        return prisma_1.default.referral.create({ data });
    }
    static async findById(id) {
        return prisma_1.default.referral.findUnique({ where: { id } });
    }
    static async findByPatient(patientId) {
        return prisma_1.default.referral.findMany({
            where: { patientId },
            orderBy: { createdAt: "desc" },
        });
    }
    static async listAll() {
        return prisma_1.default.referral.findMany({
            orderBy: { createdAt: "desc" },
        });
    }
    static async update(id, data) {
        return prisma_1.default.referral.update({
            where: { id },
            data,
        });
    }
}
exports.ReferralRepository = ReferralRepository;
