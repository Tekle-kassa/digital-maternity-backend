import { Request, Response, NextFunction } from "express";
import { RoleService } from "./role.service";

export class RoleController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await RoleService.listRoles();
      res.status(200).json({ success: true, roles });
    } catch (err) {
      next(err);
    }
  }

  static async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, roleName } = req.body;
      const result = await RoleService.assignRoleToUser(userId, roleName);
      res.status(200).json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, roleName } = req.body;
      const result = await RoleService.removeRoleFromUser(userId, roleName);
      res.status(200).json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }
}
