"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitController = void 0;
const visit_service_1 = require("./visit.service");
class VisitController {
    static async create(req, res, next) {
        try {
            const user = req.user;
            const dto = {
                ...req.body,
                recordedById: user.id,
            };
            const visit = await visit_service_1.VisitService.createVisit(dto);
            res.status(201).json({ success: true, visit });
        }
        catch (err) {
            next(err);
        }
    }
    static async getOne(req, res, next) {
        try {
            const visit = await visit_service_1.VisitService.getVisit(req.params.id);
            res.json({ success: true, visit });
        }
        catch (err) {
            next(err);
        }
    }
    static async listByPatient(req, res, next) {
        try {
            const visits = await visit_service_1.VisitService.getPatientVisits(req.params.patientId);
            res.json({ success: true, visits });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const updated = await visit_service_1.VisitService.updateVisit(req.params.id, req.body);
            res.json({ success: true, visit: updated });
        }
        catch (err) {
            next(err);
        }
    }
    static async delete(req, res, next) {
        try {
            await visit_service_1.VisitService.deleteVisit(req.params.id);
            res.json({ success: true, message: "Deleted" });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.VisitController = VisitController;
