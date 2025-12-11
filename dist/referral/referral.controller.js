"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralController = void 0;
const referral_service_1 = require("./referral.service");
class ReferralController {
    static async create(req, res, next) {
        try {
            const user = req.user;
            const dto = {
                ...req.body,
                createdById: user.id,
                attachmentUrl: req.file ? req.file.location : undefined,
            };
            const result = await referral_service_1.ReferralService.createReferral(dto);
            res.status(201).json({ success: true, referral: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getOne(req, res, next) {
        try {
            const result = await referral_service_1.ReferralService.getReferral(req.params.id);
            res.json({ success: true, referral: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async listByPatient(req, res, next) {
        try {
            const data = await referral_service_1.ReferralService.listByPatient(req.params.patientId);
            res.json({ success: true, referrals: data });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const updateData = {
                ...req.body,
                attachmentUrl: req.file ? req.file.location : undefined,
            };
            const result = await referral_service_1.ReferralService.updateReferral(req.params.id, updateData);
            res.json({ success: true, referral: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async changeStatus(req, res, next) {
        try {
            const result = await referral_service_1.ReferralService.changeStatus(req.params.id, req.body.status);
            res.json({ success: true, referral: result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ReferralController = ReferralController;
