"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UltrasoundController = void 0;
const ultrasound_service_1 = require("./ultrasound.service");
const ultrasound_validators_1 = require("./ultrasound.validators");
const AppError_1 = require("../utils/AppError");
class UltrasoundController {
    static async create(req, res, next) {
        try {
            const user = req.user;
            if (!req.file) {
                throw new AppError_1.AppError("Image is required", 400);
            }
            const imageUrl = req.file.location;
            const parsed = ultrasound_validators_1.ultrasoundSchema.parse(req.body);
            const dto = {
                ...parsed,
                imageUrl,
                takenById: user.id,
            };
            const ultrasound = await ultrasound_service_1.UltrasoundService.createUltrasound(dto);
            res.status(201).json({ success: true, ultrasound });
        }
        catch (error) {
            next(error);
        }
    }
    static async getOne(req, res, next) {
        try {
            const ultrasound = await ultrasound_service_1.UltrasoundService.getUltrasound(req.params.id);
            res.json({ success: true, ultrasound });
        }
        catch (err) {
            next(err);
        }
    }
    static async listByPatient(req, res, next) {
        try {
            const list = await ultrasound_service_1.UltrasoundService.listByPatient(req.params.patientId);
            res.json({ success: true, ultrasounds: list });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const updated = await ultrasound_service_1.UltrasoundService.updateUltrasound(req.params.id, req.body);
            res.json({ success: true, ultrasound: updated });
        }
        catch (err) {
            next(err);
        }
    }
    static async delete(req, res, next) {
        try {
            await ultrasound_service_1.UltrasoundService.deleteUltrasound(req.params.id);
            res.json({ success: true, message: "Deleted" });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UltrasoundController = UltrasoundController;
