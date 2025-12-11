"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GBVController = void 0;
const gbv_service_1 = require("./gbv.service");
class GBVController {
    static async create(req, res, next) {
        try {
            const user = req.user;
            const dto = {
                ...req.body,
                recordedById: user.id,
            };
            const result = await gbv_service_1.GBVService.createGBV(dto);
            res.status(201).json({ success: true, id: result.id });
        }
        catch (error) {
            next(error);
        }
    }
    static async getOne(req, res, next) {
        try {
            const data = await gbv_service_1.GBVService.getGBV(req.params.id);
            res.status(200).json({ success: true, report: data });
        }
        catch (error) {
            next(error);
        }
    }
    static async listByPatient(req, res, next) {
        try {
            const list = await gbv_service_1.GBVService.listByPatient(req.params.patientId);
            res.status(200).json({ success: true, reports: list });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const user = req.user;
            const result = await gbv_service_1.GBVService.updateGBV(req.params.id, user.id, req.body);
            res.status(200).json({ success: true, id: result.id });
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            const user = req.user;
            const result = await gbv_service_1.GBVService.deleteGBV(req.params.id, user.id);
            res.status(200).json({ success: true, id: result.id });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.GBVController = GBVController;
