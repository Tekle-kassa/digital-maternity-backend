"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const pateint_service_1 = require("./pateint.service");
const patient_validators_1 = require("./patient.validators");
class PatientController {
    static async create(req, res, next) {
        try {
            const parsed = patient_validators_1.patientSchema.parse(req.body);
            const user = req.user;
            const dto = { ...parsed, createdById: user.id };
            const patient = await pateint_service_1.PatientService.createPatient(dto);
            res.status(200).json({
                success: true,
                patient,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async list(req, res, next) {
        try {
            const patients = await pateint_service_1.PatientService.listPatients();
            res.json({ success: true, patients });
        }
        catch (err) {
            next(err);
        }
    }
    static async getOne(req, res, next) {
        try {
            const patient = await pateint_service_1.PatientService.getPatient(req.params.id);
            res.json({ success: true, patient });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const patient = await pateint_service_1.PatientService.updatePatient(req.params.id, req.body);
            res.json({ success: true, patient });
        }
        catch (err) {
            next(err);
        }
    }
    static async delete(req, res, next) {
        try {
            await pateint_service_1.PatientService.deletePatient(req.params.id);
            res.json({ success: true, message: "Deleted" });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PatientController = PatientController;
