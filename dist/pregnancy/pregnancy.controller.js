"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PregnancyController = void 0;
const pregnancy_service_1 = require("./pregnancy.service");
class PregnancyController {
    static async create(req, res, next) {
        try {
            const dto = {
                patientId: req.body.patientId,
                startDate: new Date(req.body.startDate),
                estimatedDue: req.body.estimatedDue
                    ? new Date(req.body.estimatedDue)
                    : undefined,
            };
            const pregnancy = await pregnancy_service_1.PregnancyService.createPregnancy(dto);
            res.status(201).json({ success: true, pregnancy });
        }
        catch (err) {
            next(err);
        }
    }
    static async getOne(req, res, next) {
        try {
            const pregnancy = await pregnancy_service_1.PregnancyService.getPregnancy(req.params.id);
            res.json({ success: true, pregnancy });
        }
        catch (err) {
            next(err);
        }
    }
    static async listByPatient(req, res, next) {
        try {
            const pregnancies = await pregnancy_service_1.PregnancyService.listByPatient(req.params.patientId);
            res.json({ success: true, pregnancies });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const pregnancy = await pregnancy_service_1.PregnancyService.updatePregnancy(req.params.id, req.body);
            res.json({ success: true, pregnancy });
        }
        catch (err) {
            next(err);
        }
    }
    static async end(req, res, next) {
        try {
            const pregnancy = await pregnancy_service_1.PregnancyService.endPregnancy(req.params.id);
            res.json({ success: true, pregnancy });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PregnancyController = PregnancyController;
