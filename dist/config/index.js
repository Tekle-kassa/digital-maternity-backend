"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.default = {
    port: process.env.PORT ? Number(process.env.PORT) : 4000,
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || "change_me",
        refreshSecret: process.env.JWT_REFRESH_SECRET || "change_me_too",
        accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
        refreshExpiresDays: process.env.REFRESH_TOKEN_EXPIRES_DAYS
            ? Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS)
            : 30,
    },
    bcryptRounds: process.env.BCRYPT_SALT_ROUNDS
        ? Number(process.env.BCRYPT_SALT_ROUNDS)
        : 12,
};
