"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANCController = void 0;
const anc_service_1 = require("./anc.service");
const anc_validators_1 = require("./anc.validators");
class ANCController {
    static async createANCVisit(req, res, next) {
        try {
            const parsed = anc_validators_1.ancVisitSchema.parse(req.body);
            const visit = await anc_service_1.ANCService.createANCVisit({
                ...parsed,
                visitDate: new Date(parsed.visitDate),
                recordedById: req.user.userId,
            });
            res.status(201).json({ success: true, visit });
        }
        catch (err) {
            next(err);
        }
    }
    static async getVisitsByPatient(req, res, next) {
        try {
            const visits = await anc_service_1.ANCService.getVisitsByPatient(req.params.patientId);
            res.json({ success: true, visits });
        }
        catch (err) {
            next(err);
        }
    }
    static async getAllVisits(req, res, next) {
        try {
            const visits = await anc_service_1.ANCService.getAllVisits();
            res.json({ success: true, visits });
        }
        catch (err) {
            next(err);
        }
    }
    static async updateANCVisit(req, res, next) {
        try {
            const visit = await anc_service_1.ANCService.updateANCVisit(req.params.visitId, req.body);
            res.json({ success: true, visit });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ANCController = ANCController;
