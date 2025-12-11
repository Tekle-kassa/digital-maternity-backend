"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
const prisma_1 = __importDefault(require("../config/prisma"));
async function log(userId, action, meta = {}, ip = null) {
    try {
        await prisma_1.default.auditLog.create({
            data: {
                userId: userId || null,
                action,
                meta,
                ip,
            },
        });
    }
    catch (err) {
        // don't block flow on audit failure
        // consider pushing to a queue in production
        // eslint-disable-next-line no-console
        console.error("Audit log failed", err);
    }
}
