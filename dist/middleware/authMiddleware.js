"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorizeRoles = authorizeRoles;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// import { Role } from "../../generated/prisma/enums";
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "supersecretkey";
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: "Missing token" });
    const token = authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Invalid token format" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            userId: payload.userId,
            roles: payload.roles,
        };
        next();
    }
    catch (err) {
        console.log(err);
        res.status(401).json({ message: "Invalid or expired token" });
    }
}
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const userRoles = req.user.roles || [];
        const hasRole = userRoles.some((role) => allowedRoles.includes(role));
        if (!hasRole) {
            return res.status(403).json({
                message: "Forbidden: Insufficient role",
            });
        }
        next();
    };
}
