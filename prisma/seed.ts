import dotenv from "dotenv";
dotenv.config();
import prisma from "../src/config/prisma";

async function main() {
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
  console.log("🌱 Roles seeded successfully");
}
main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
