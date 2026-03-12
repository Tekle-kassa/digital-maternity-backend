import { AnalyticsRepository } from "./analytics.repository";

export interface DashboardStats {
  totalPatients: number;
  activePregnancies: number;
  highRiskCount: number;
  appointmentsToday: number;
  totalVisits: number;
  upcomingAppointments: number;
  patientsWithReferrals: number;
  totalDeliveries: number;
  totalPNCVisits: number;
  totalGBVCases: number;
  patientsThisMonth: number;
  visitsThisMonth: number;
}

export class AnalyticsService {
  static async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalPatients,
      activePregnancies,
      highRiskCount,
      appointmentsToday,
      totalVisits,
      upcomingAppointments,
      patientsWithReferrals,
      totalDeliveries,
      totalPNCVisits,
      totalGBVCases,
      patientsThisMonth,
      visitsThisMonth,
    ] = await Promise.all([
      AnalyticsRepository.getTotalPatients(),
      AnalyticsRepository.getActivePregnancies(),
      AnalyticsRepository.getHighRiskCount(),
      AnalyticsRepository.getAppointmentsToday(),
      AnalyticsRepository.getTotalVisits(),
      AnalyticsRepository.getUpcomingAppointments(7),
      AnalyticsRepository.getPatientsWithReferrals(),
      AnalyticsRepository.getTotalDeliveries(),
      AnalyticsRepository.getTotalPNCVisits(),
      AnalyticsRepository.getTotalGBVCases(),
      AnalyticsRepository.getPatientsThisMonth(),
      AnalyticsRepository.getVisitsThisMonth(),
    ]);

    return {
      totalPatients,
      activePregnancies,
      highRiskCount,
      appointmentsToday,
      totalVisits,
      upcomingAppointments,
      patientsWithReferrals,
      totalDeliveries,
      totalPNCVisits,
      totalGBVCases,
      patientsThisMonth,
      visitsThisMonth,
    };
  }

  static async getAppointmentsTodayDetails() {
    return AnalyticsRepository.getAppointmentsTodayDetails();
  }

  static async getHighRiskPatientsDetails() {
    return AnalyticsRepository.getHighRiskPatientsDetails();
  }
}
