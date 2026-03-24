import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import config from "../config";

const db = prisma as any;

export type SeedScope = "roles" | "demo" | "all";

export class SeedService {
  static async seedRoles() {
    const roles = [
      { name: "ADMIN", description: "System administrator" },
      { name: "MIDWIFE", description: "Handles ANC visits" },
      { name: "DOCTOR", description: "Provides oversight and teleconsult" },
      { name: "GBV_OFFICER", description: "Handles GBV cases" },
      { name: "NURSE", description: "Assists with care" },
    ];
    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
    }
    return { rolesSeeded: roles.length };
  }

  static async seedDemoClinic() {
    const count = await db.clinic?.count?.();
    if (count > 0) return { clinicsSeeded: 0, message: "Clinics already exist" };

    const clinic = await db.clinic.create({
      data: {
        name: "Demo Health Center",
        location: "Addis Ababa",
        region: "Addis Ababa",
        zone: "Bole",
        woreda: "Woreda 03",
        type: "fixed",
        status: "active",
        patientCount: 0,
      },
    });
    return { clinicsSeeded: 1, clinicId: clinic.id };
  }

  static async seedDemoRiskRules() {
    const existing = await db.riskRule?.count?.();
    if (existing > 0) return { riskRulesSeeded: 0, message: "Risk rules already exist" };

    await db.riskRule.createMany({
      data: [
        {
          name: "Age under 18",
          description: "Maternal age below 18 years",
          condition: "age < 18",
          weight: 10,
          version: "1.0",
          isActive: true,
        },
        {
          name: "Previous CS",
          description: "History of cesarean section",
          condition: "previous_cs == true",
          weight: 15,
          version: "1.0",
          isActive: true,
        },
      ],
    });
    return { riskRulesSeeded: 2 };
  }

  static async seedDemoAdminUser() {
    const email = process.env.SEED_ADMIN_EMAIL || "admin@demo.local";
    const phone = process.env.SEED_ADMIN_PHONE || "+251900000001";
    const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] } as any,
    });
    if (existing) return { adminSeeded: false, message: "Admin or phone already exists" };

    const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
    if (!adminRole) throw new Error("ADMIN role missing — run scope roles first");

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const user = await prisma.user.create({
      data: {
        phone,
        email,
        fullName: "Demo Admin",
        passwordHash,
        mustChangePassword: true,
        roles: {
          create: {
            roleId: adminRole.id,
          },
        },
      } as any,
    });
    return {
      adminSeeded: true,
      userId: user.id,
      email,
      phone,
      password: "*** set via SEED_ADMIN_PASSWORD or default ChangeMe123! ***",
    };
  }

  static async run(scope: SeedScope) {
    const out: Record<string, unknown> = {};

    if (scope === "roles" || scope === "all") {
      Object.assign(out, await this.seedRoles());
    }

    if (scope === "demo" || scope === "all") {
      try {
        Object.assign(out, await this.seedDemoClinic());
      } catch (e) {
        out.clinicError = String(e);
      }
      try {
        Object.assign(out, await this.seedDemoRiskRules());
      } catch (e) {
        out.riskRulesError = String(e);
      }
      try {
        Object.assign(out, await this.seedDemoAdminUser());
      } catch (e) {
        out.adminError = String(e);
      }
    }

    return out;
  }
}
