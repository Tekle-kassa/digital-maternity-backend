import prisma from "../config/prisma";

export class AnalyticsRepository {
  // Total patients registered
  static async getTotalPatients() {
    return prisma.patient.count();
  }

  // Active pregnancies
  static async getActivePregnancies() {
    return prisma.pregnancy.count({
      where: { active: true },
    });
  }

  // High risk patients count
  static async getHighRiskCount() {
    // Get unique patient IDs with high risk indicators
    const [gbvHighRisk, ancHighRisk, referrals] = await Promise.all([
      // GBV reports marked as high risk
      prisma.gBVReport.findMany({
        where: { highRisk: true },
        select: { patientId: true },
      }),
      // ANC records with medical conditions or danger signs
      prisma.aNCRecord.findMany({
        where: {
          OR: [
            { diabetesMellitus: true },
            { cardiacDisease: true },
            { chronicHypertension: true },
            { otherMedicalCondition: true },
            { dangerSignsIdentified: { not: null } },
            { jaundice: true },
            { chestAbnormality: true },
            { heartAbnormality: true },
          ],
        },
        select: { patientId: true },
      }),
      // Patients with referrals (might indicate high risk)
      prisma.referral.findMany({
        select: { patientId: true },
      }),
    ]);

    // Combine all patient IDs and get unique count
    const allPatientIds = new Set<string>();
    gbvHighRisk.forEach((r) => allPatientIds.add(r.patientId));
    ancHighRisk.forEach((r) => allPatientIds.add(r.patientId));
    referrals.forEach((r) => allPatientIds.add(r.patientId));

    return allPatientIds.size;
  }

  // Appointments today (visits scheduled for today)
  static async getAppointmentsToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.visit.count({
      where: {
        visitDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  // Total visits
  static async getTotalVisits() {
    return prisma.visit.count();
  }

  // Upcoming appointments (next 7 days)
  static async getUpcomingAppointments(days: number = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    return prisma.visit.count({
      where: {
        visitDate: {
          gte: today,
          lte: futureDate,
        },
      },
    });
  }

  // Patients with referrals
  static async getPatientsWithReferrals() {
    return prisma.referral.groupBy({
      by: ["patientId"],
    }).then((result) => result.length);
  }

  // Total deliveries
  static async getTotalDeliveries() {
    return prisma.delivery.count();
  }

  // Total PNC visits
  static async getTotalPNCVisits() {
    return prisma.pNCVisit.count();
  }

  // Total GBV cases
  static async getTotalGBVCases() {
    return prisma.gBVReport.count();
  }

  // Patients registered this month
  static async getPatientsThisMonth() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });
  }

  // Visits this month
  static async getVisitsThisMonth() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return prisma.visit.count({
      where: {
        visitDate: {
          gte: startOfMonth,
        },
      },
    });
  }

  // Get detailed appointments for today
  static async getAppointmentsTodayDetails() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.visit.findMany({
      where: {
        visitDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            age: true,
          },
        },
        pregnancy: {
          select: {
            id: true,
            estimatedDue: true,
            active: true,
          },
        },
        recordedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        visitDate: "asc",
      },
    });
  }

  // Get high risk patients details
  static async getHighRiskPatientsDetails() {
    const [gbvHighRisk, ancHighRisk, referrals] = await Promise.all([
      prisma.gBVReport.findMany({
        where: { highRisk: true },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              age: true,
            },
          },
        },
      }),
      prisma.aNCRecord.findMany({
        where: {
          OR: [
            { diabetesMellitus: true },
            { cardiacDisease: true },
            { chronicHypertension: true },
            { otherMedicalCondition: true },
            { dangerSignsIdentified: { not: null } },
            { jaundice: true },
            { chestAbnormality: true },
            { heartAbnormality: true },
          ],
        },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              age: true,
            },
          },
        },
      }),
      prisma.referral.findMany({
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              age: true,
            },
          },
        },
      }),
    ]);

    // Combine and deduplicate by patient ID
    const patientMap = new Map<string, any>();

    gbvHighRisk.forEach((report) => {
      if (!patientMap.has(report.patientId)) {
        patientMap.set(report.patientId, {
          patient: report.patient,
          riskFactors: ["GBV High Risk"],
        });
      } else {
        patientMap.get(report.patientId).riskFactors.push("GBV High Risk");
      }
    });

    ancHighRisk.forEach((record) => {
      const riskFactors: string[] = [];
      if (record.diabetesMellitus) riskFactors.push("Diabetes Mellitus");
      if (record.cardiacDisease) riskFactors.push("Cardiac Disease");
      if (record.chronicHypertension)
        riskFactors.push("Chronic Hypertension");
      if (record.otherMedicalCondition)
        riskFactors.push("Other Medical Condition");
      if (record.dangerSignsIdentified)
        riskFactors.push("Danger Signs Identified");
      if (record.jaundice) riskFactors.push("Jaundice");
      if (record.chestAbnormality) riskFactors.push("Chest Abnormality");
      if (record.heartAbnormality) riskFactors.push("Heart Abnormality");

      if (!patientMap.has(record.patientId)) {
        patientMap.set(record.patientId, {
          patient: record.patient,
          riskFactors,
        });
      } else {
        const existing = patientMap.get(record.patientId);
        existing.riskFactors = [
          ...new Set([...existing.riskFactors, ...riskFactors]),
        ];
      }
    });

    referrals.forEach((referral) => {
      if (!patientMap.has(referral.patientId)) {
        patientMap.set(referral.patientId, {
          patient: referral.patient,
          riskFactors: ["Referral"],
        });
      } else {
        const existing = patientMap.get(referral.patientId);
        if (!existing.riskFactors.includes("Referral")) {
          existing.riskFactors.push("Referral");
        }
      }
    });

    return Array.from(patientMap.values());
  }
}
