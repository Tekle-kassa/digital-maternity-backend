import { dbRoleToApi, dbRolesToApi } from "./roles";

type UserWithRoles = {
  id: string;
  fullName: string | null;
  phone: string;
  email: string | null;
  profileImageUrl: string | null;
  clinicId: string | null;
  createdAt: Date;
  updatedAt: Date;
  clinic?: { name: string } | null;
  roles: { role: { name: string } }[];
};

export function mapUserToApiResponse(u: UserWithRoles) {
  return {
    id: u.id,
    name: u.fullName ?? u.phone,
    email: u.email ?? `${u.phone}@phone.local`,
    role: dbRolesToApi(u.roles) as
      | "midwife"
      | "nurse"
      | "doctor"
      | "specialist"
      | "admin"
      | "health_authority"
      | "partner_analyst"
      | "gbv_officer",
    avatar: u.profileImageUrl ?? undefined,
    clinic: u.clinic?.name,
    clinicId: u.clinicId ?? undefined,
    lastActive: u.updatedAt.toISOString(),
    status: "offline" as const,
    createdAt: u.createdAt.toISOString(),
  };
}

export function mapPatientToApi(p: {
  id: string;
  fullName: string;
  unfpId: string;
  phone: string | null;
  age: number | null;
  address: string | null;
  woreda: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  createdAt: Date;
  idNumber?: string | null;
}) {
  return {
    id: p.id,
    fullName: p.fullName,
    age: p.age ?? 0,
    dateOfBirth: new Date(0).toISOString().slice(0, 10),
    idNumber: p.idNumber ?? p.unfpId,
    phoneNumber: p.phone ?? undefined,
    address: p.address ?? "",
    village: p.woreda ?? "",
    emergencyContact: p.emergencyContact ?? "",
    emergencyPhone: p.emergencyPhone ?? "",
    pregnancyStatus: "pregnant" as const,
    gravida: 0,
    para: 0,
    riskLevel: "low" as const,
    riskScore: 0,
    riskFactors: [] as string[],
    registeredAt: p.createdAt.toISOString(),
    assignedMidwife: "",
    assignedMidwifeId: "",
    syncStatus: "synced" as const,
    clinicId: "",
    clinicName: "",
  };
}

export function mapVisitToApi(
  v: {
    id: string;
    patientId: string;
    visitDate: Date;
    visitNumber: number | null;
    gestationalAge: number | null;
    bloodPressure: string | null;
    temperature: number | null;
    weight: number | null;
    symptoms: string | null;
    notes: string | null;
    recordedById: string;
    createdAt: Date;
  },
  patientName: string,
  conductedName: string,
  clinicId = ""
) {
  const bp = v.bloodPressure?.split("/").map((x) => parseInt(x.trim(), 10)) ?? [
    0, 0,
  ];
  return {
    id: v.id,
    patientId: v.patientId,
    patientName,
    visitDate: v.visitDate.toISOString(),
    visitNumber: v.visitNumber ?? 1,
    gestationalAge: {
      weeks: v.gestationalAge ?? 0,
      days: 0,
    },
    vitals: {
      bloodPressureSystolic: bp[0] || 0,
      bloodPressureDiastolic: bp[1] || 0,
      weight: v.weight ?? 0,
      temperature: v.temperature ?? 0,
      pulse: 0,
      respiratoryRate: 0,
    },
    symptoms: v.symptoms ? v.symptoms.split(",").map((s: any) => s.trim()) : [],
    medications: [] as string[],
    notes: v.notes ?? "",
    riskFlags: [] as string[],
    conductedBy: conductedName,
    conductedById: v.recordedById,
    syncStatus: "synced" as const,
    clinicId,
    createdAt: v.createdAt.toISOString(),
  };
}

export function mapUltrasoundToApi(
  u: {
    id: string;
    patientId: string;
    visitId: string | null;
    imageUrl: string;
    description: string | null;
    gestationalAge: number | null;
    annotations: string | null;
    createdAt: Date;
    takenById: string;
  },
  patientName: string,
  capturedName: string
) {
  return {
    id: u.id,
    patientId: u.patientId,
    patientName,
    visitId: u.visitId ?? undefined,
    captureDate: u.createdAt.toISOString(),
    imageUrl: u.imageUrl,
    thumbnailUrl: u.imageUrl,
    gestationalAge: { weeks: u.gestationalAge ?? 0, days: 0 },
    findings: u.description ?? "",
    annotations: u.annotations ? [u.annotations] : [],
    quality: "good" as const,
    capturedBy: capturedName,
    capturedById: u.takenById,
    reviewStatus: "pending" as const,
    syncStatus: "synced" as const,
    createdAt: u.createdAt.toISOString(),
  };
}

export function mapGbvToApi(
  r: {
    id: string;
    patientId: string;
    incidentType: string | null;
    incidentDate: Date | null;
    createdAt: Date;
    recordedById: string;
    highRisk: boolean;
  },
  patientName: string,
  reportedName: string
) {
  return {
    id: r.id,
    patientId: r.patientId,
    patientName,
    reportDate: r.createdAt.toISOString(),
    incidentDate: r.incidentDate?.toISOString(),
    incidentType: (r.incidentType as "physical" | "sexual" | "emotional" | "economic" | "other") ?? "other",
    description: "",
    safetyPlan: "",
    referrals: [] as string[],
    followUpRequired: r.highRisk,
    status: "open" as const,
    confidentialityLevel: "standard" as const,
    reportedBy: reportedName,
    reportedById: r.recordedById,
    attachments: [] as string[],
    syncStatus: "synced" as const,
    createdAt: r.createdAt.toISOString(),
  };
}

export { dbRoleToApi };
