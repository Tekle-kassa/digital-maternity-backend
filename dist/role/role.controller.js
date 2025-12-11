"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const role_service_1 = require("./role.service");
class RoleController {
    static async list(req, res, next) {
        try {
            const roles = await role_service_1.RoleService.listRoles();
            res.status(200).json({ success: true, roles });
        }
        catch (err) {
            next(err);
        }
    }
    static async assign(req, res, next) {
        try {
            const { userId, roleName } = req.body;
            const result = await role_service_1.RoleService.assignRoleToUser(userId, roleName);
            res.status(200).json({ success: true, result });
        }
        catch (err) {
            next(err);
        }
    }
    static async remove(req, res, next) {
        try {
            const { userId, roleName } = req.body;
            const result = await role_service_1.RoleService.removeRoleFromUser(userId, roleName);
            res.status(200).json({ success: true, result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.RoleController = RoleController;
