import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "./analytics.service";

export class AnalyticsController {
  static async getDashboardStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stats = await AnalyticsService.getDashboardStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAppointmentsToday(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const appointments = await AnalyticsService.getAppointmentsTodayDetails();
      res.json({
        success: true,
        count: appointments.length,
        appointments,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHighRiskPatients(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const patients = await AnalyticsService.getHighRiskPatientsDetails();
      res.json({
        success: true,
        count: patients.length,
        patients,
      });
    } catch (error) {
      next(error);
    }
  }
}
