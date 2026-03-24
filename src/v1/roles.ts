/** Map API-REFERENCE / api-schema role strings to DB Role.name values (seed). */
const API_TO_DB: Record<string, string> = {
  midwife: "MIDWIFE",
  nurse: "NURSE",
  doctor: "DOCTOR",
  specialist: "DOCTOR",
  admin: "ADMIN",
  health_authority: "SUPERVISOR",
  partner_analyst: "SUPERVISOR",
  gbv_officer: "GBV_OFFICER",
};

const DB_TO_API: Record<string, string> = {
  MIDWIFE: "midwife",
  NURSE: "nurse",
  DOCTOR: "doctor",
  ADMIN: "admin",
  GBV_OFFICER: "gbv_officer",
  SUPERVISOR: "health_authority",
};

export function apiRoleToDb(role: string): string | undefined {
  return API_TO_DB[role];
}

export function dbRoleToApi(roleName: string): string {
  return DB_TO_API[roleName] ?? roleName.toLowerCase();
}

export function dbRolesToApi(roles: { role: { name: string } }[]): string {
  const first = roles[0]?.role?.name;
  return dbRoleToApi(first ?? "MIDWIFE");
}
