"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_validators_1 = require("./auth.validators");
class AuthController {
    static async register(req, res, next) {
        try {
            const parsed = auth_validators_1.registerSchema.parse(req.body);
            console.log(req.user);
            const { phone, password, fullName } = parsed;
            const user = await auth_service_1.AuthService.register({
                phone,
                password,
                fullName,
                ip: req.ip,
            });
            res.status(201).json({ success: true, user });
        }
        catch (err) {
            next(err);
        }
    }
    static async login(req, res, next) {
        try {
            const parsed = auth_validators_1.loginSchema.parse(req.body);
            const { phone, password } = parsed;
            const data = await auth_service_1.AuthService.login({ password, phone, ip: req.ip });
            res.status(200).json({ success: true, ...data });
        }
        catch (err) {
            next(err);
        }
    }
    static async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const data = await auth_service_1.AuthService.refresh({
                refreshToken,
                ip: req.ip,
            });
            return res.json({
                success: true,
                ...data,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async changePassword(req, res, next) {
        try {
            const parsed = auth_validators_1.changePasswordSchema.parse(req.body);
            const { currentPassword, newPassword } = parsed;
            const userId = req.user.userId;
            const data = await auth_service_1.AuthService.changePassword({
                userId,
                currentPassword,
                newPassword,
                ip: req.ip,
            });
            res.status(200).json({ success: true, ...data });
        }
        catch (err) {
            next(err);
        }
    }
    static async firstTimeChangePassword(req, res, next) {
        try {
            const parsed = auth_validators_1.firstTimeChangePasswordSchema.parse(req.body);
            const { phone, initialPassword, newPassword } = parsed;
            const data = await auth_service_1.AuthService.firstTimeChangePassword({
                phone,
                initialPassword,
                newPassword,
                ip: req.ip,
            });
            res.status(200).json({ success: true, ...data });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
