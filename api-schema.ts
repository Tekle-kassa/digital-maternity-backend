// ============================================================================
// UNFPA Digital Maternity Package (DMP) — Complete API Schema
// ============================================================================
//
// Base URL: /api/v1
//
// Authentication: Bearer JWT token in Authorization header
// Content-Type: application/json (unless file upload)
//
// Standard response envelope:
//   { data: T, meta?: PaginationMeta }             — success
//   { error: { code: string, message: string } }    — failure
//
// Standard query params for list endpoints:
//   page, limit, sort, order (asc|desc), search
// ============================================================================

// ---------------------------------------------------------------------------
// 0. Shared / Common Types
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type SyncStatus = "synced" | "pending" | "conflict";

// ---------------------------------------------------------------------------
// 1. AUTH  —  /api/v1/auth
// ---------------------------------------------------------------------------

// POST /auth/login
export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserResponse;
}

// POST /auth/refresh
export interface RefreshTokenRequest {
  refreshToken: string;
}
export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// POST /auth/logout
// Headers: Authorization Bearer <token>
// Response: 204 No Content

// POST /auth/forgot-password
export interface ForgotPasswordRequest {
  email: string;
}

// POST /auth/reset-password
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ---------------------------------------------------------------------------
// 2. USERS  —  /api/v1/users
// ---------------------------------------------------------------------------

export type UserRole =
  | "midwife"
  | "nurse"
  | "doctor"
  | "specialist"
  | "admin"
  | "health_authority"
  | "partner_analyst"
  | "gbv_officer";

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  clinic?: string;
  clinicId?: string;
  lastActive: string;
  status: "online" | "offline" | "away";
  createdAt: string;
}

// GET  /users          — list all users (admin only)
//   Query: ?role=midwife&clinicId=c1&status=online
// GET  /users/me       — current authenticated user
// GET  /users/:id      — single user

// POST /users          — create user (admin only)
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  clinicId?: string;
  avatar?: string;
}

// PATCH /users/:id     — update user
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  clinicId?: string;
  avatar?: string;
  status?: "online" | "offline" | "away";
}

// PATCH /users/me/password — change own password
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// DELETE /users/:id    — deactivate user (admin only)

// ---------------------------------------------------------------------------
// 3. CLINICS  —  /api/v1/clinics
// ---------------------------------------------------------------------------

export interface ClinicResponse {
  id: string;
  name: string;
  location: string;
  region: string;
  zone: string;
  woreda: string;
  type: "fixed" | "mobile";
  status: "active" | "inactive";
  staff: UserResponse[];
  patientCount: number;
  lastSync: string;
  createdAt: string;
}

// GET  /clinics               — list clinics
//   Query: ?region=Somali&zone=Nogob&type=mobile&status=active
// GET  /clinics/:id           — single clinic
// GET  /clinics/:id/stats     — per-clinic statistics (same shape as ClinicStatsResponse)

// POST /clinics               — create clinic
export interface CreateClinicRequest {
  name: string;
  location: string;
  region: string;
  zone: string;
  woreda: string;
  type: "fixed" | "mobile";
  staffIds?: string[];
}

// PATCH /clinics/:id          — update clinic
export interface UpdateClinicRequest {
  name?: string;
  location?: string;
  region?: string;
  zone?: string;
  woreda?: string;
  type?: "fixed" | "mobile";
  status?: "active" | "inactive";
  staffIds?: string[];
}

// DELETE /clinics/:id         — deactivate clinic

// ---------------------------------------------------------------------------
// 4. PATIENTS  —  /api/v1/patients
// ---------------------------------------------------------------------------

export interface PatientResponse {
  id: string;
  fullName: string;
  age: number;
  dateOfBirth: string;
  idNumber: string;
  phoneNumber?: string;
  address: string;
  village: string;
  emergencyContact: string;
  emergencyPhone: string;
  pregnancyStatus: "pregnant" | "postpartum" | "not_pregnant";
  gravida: number;
  para: number;
  lmpDate?: string;
  eddDate?: string;
  bloodType?: string;
  hivStatus?: "positive" | "negative" | "unknown";
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  riskFactors: string[];
  registeredAt: string;
  lastVisit?: string;
  assignedMidwife: string;
  assignedMidwifeId: string;
  syncStatus: SyncStatus;
  clinicId: string;
  clinicName: string;
}

// GET  /patients               — list patients
//   Query: ?clinicId=c1&riskLevel=high&pregnancyStatus=pregnant
//          &assignedMidwifeId=u2&syncStatus=pending&search=halima
// GET  /patients/:id           — single patient (includes recent visits, upcoming appts)
// GET  /patients/:id/visits    — all prenatal visits for a patient
// GET  /patients/:id/ultrasounds — all ultrasound records for a patient
// GET  /patients/:id/teleconsults — all teleconsult requests for a patient
// GET  /patients/:id/gbv-reports  — all GBV reports for a patient (restricted access)
// GET  /patients/:id/alerts    — alerts related to a patient

// POST /patients               — register new patient
export interface CreatePatientRequest {
  fullName: string;
  dateOfBirth: string;
  idNumber: string;
  phoneNumber?: string;
  address: string;
  village: string;
  emergencyContact: string;
  emergencyPhone: string;
  pregnancyStatus: "pregnant" | "postpartum" | "not_pregnant";
  gravida: number;
  para: number;
  lmpDate?: string;
  eddDate?: string;
  bloodType?: string;
  hivStatus?: "positive" | "negative" | "unknown";
  assignedMidwifeId: string;
  clinicId: string;
}

// PATCH /patients/:id          — update patient
export interface UpdatePatientRequest {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  village?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  pregnancyStatus?: "pregnant" | "postpartum" | "not_pregnant";
  gravida?: number;
  para?: number;
  lmpDate?: string;
  eddDate?: string;
  bloodType?: string;
  hivStatus?: "positive" | "negative" | "unknown";
  riskLevel?: "low" | "medium" | "high" | "critical";
  riskScore?: number;
  riskFactors?: string[];
  assignedMidwifeId?: string;
  clinicId?: string;
}

// DELETE /patients/:id         — soft-delete / archive patient

// ---------------------------------------------------------------------------
// 5. PRENATAL VISITS  —  /api/v1/visits
// ---------------------------------------------------------------------------

export interface PrenatalVisitResponse {
  id: string;
  patientId: string;
  patientName: string;
  visitDate: string;
  visitNumber: number;
  gestationalAge: { weeks: number; days: number };
  vitals: {
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    weight: number;
    temperature: number;
    pulse: number;
    respiratoryRate: number;
    fetalHeartRate?: number;
    fundalHeight?: number;
  };
  symptoms: string[];
  medications: string[];
  labResults?: {
    hemoglobin?: number;
    urinalysis?: string;
    glucoseLevel?: number;
  };
  notes: string;
  nextAppointment?: string;
  riskFlags: string[];
  conductedBy: string;
  conductedById: string;
  syncStatus: SyncStatus;
  clinicId: string;
  createdAt: string;
}

// GET  /visits                  — list visits
//   Query: ?patientId=p1&clinicId=c1&conductedById=u2
//          &from=2024-11-01&to=2024-12-01
// GET  /visits/:id              — single visit

// POST /visits                  — record new visit
export interface CreateVisitRequest {
  patientId: string;
  visitDate: string;
  gestationalAge: { weeks: number; days: number };
  vitals: {
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    weight: number;
    temperature: number;
    pulse: number;
    respiratoryRate: number;
    fetalHeartRate?: number;
    fundalHeight?: number;
  };
  symptoms: string[];
  medications: string[];
  labResults?: {
    hemoglobin?: number;
    urinalysis?: string;
    glucoseLevel?: number;
  };
  notes: string;
  nextAppointment?: string;
  riskFlags: string[];
}

// PATCH /visits/:id             — update visit
export interface UpdateVisitRequest {
  vitals?: Partial<CreateVisitRequest["vitals"]>;
  symptoms?: string[];
  medications?: string[];
  labResults?: CreateVisitRequest["labResults"];
  notes?: string;
  nextAppointment?: string;
  riskFlags?: string[];
}

// DELETE /visits/:id            — delete visit (admin only)

// ---------------------------------------------------------------------------
// 6. ULTRASOUND  —  /api/v1/ultrasounds
// ---------------------------------------------------------------------------

export interface UltrasoundResponse {
  id: string;
  patientId: string;
  patientName: string;
  visitId?: string;
  captureDate: string;
  imageUrl: string;
  thumbnailUrl: string;
  gestationalAge: { weeks: number; days: number };
  findings: string;
  annotations: string[];
  measurements?: {
    bpd?: number;
    fl?: number;
    ac?: number;
    hc?: number;
    efw?: number;
  };
  quality: "excellent" | "good" | "fair" | "poor";
  capturedBy: string;
  capturedById: string;
  reviewedBy?: string;
  reviewedById?: string;
  reviewStatus: "pending" | "reviewed" | "flagged";
  syncStatus: SyncStatus;
  createdAt: string;
}

// GET  /ultrasounds             — list ultrasounds
//   Query: ?patientId=p1&reviewStatus=pending&quality=fair&capturedById=u2
// GET  /ultrasounds/:id         — single ultrasound

// POST /ultrasounds             — upload new ultrasound
//   Content-Type: multipart/form-data
export interface CreateUltrasoundRequest {
  patientId: string;
  visitId?: string;
  captureDate: string;
  image: File;                    // uploaded file
  gestationalAge: { weeks: number; days: number };
  findings: string;
  annotations: string[];
  measurements?: {
    bpd?: number;
    fl?: number;
    ac?: number;
    hc?: number;
    efw?: number;
  };
  quality: "excellent" | "good" | "fair" | "poor";
}

// PATCH /ultrasounds/:id        — update ultrasound (review, add findings)
export interface UpdateUltrasoundRequest {
  findings?: string;
  annotations?: string[];
  measurements?: UltrasoundResponse["measurements"];
  quality?: "excellent" | "good" | "fair" | "poor";
  reviewStatus?: "pending" | "reviewed" | "flagged";
  reviewedById?: string;
}

// DELETE /ultrasounds/:id       — delete ultrasound record

// ---------------------------------------------------------------------------
// 7. GBV REPORTS  —  /api/v1/gbv-reports
// ---------------------------------------------------------------------------
//
// ACCESS CONTROL: Only roles gbv_officer, doctor, admin can access.
// confidentialityLevel "restricted" limits access further.
// ---------------------------------------------------------------------------

export interface GBVReportResponse {
  id: string;
  patientId: string;
  patientName: string;
  reportDate: string;
  incidentDate?: string;
  incidentType: "physical" | "sexual" | "emotional" | "economic" | "other";
  description: string;
  perpetratorRelation?: string;
  injuries?: string;
  safetyPlan: string;
  referrals: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  status: "open" | "in_progress" | "referred" | "closed";
  confidentialityLevel: "standard" | "high" | "restricted";
  reportedBy: string;
  reportedById: string;
  attachments: string[];
  syncStatus: SyncStatus;
  createdAt: string;
}

// GET  /gbv-reports             — list GBV reports
//   Query: ?patientId=p4&status=open&incidentType=physical
//          &confidentialityLevel=restricted&followUpRequired=true
// GET  /gbv-reports/:id         — single report

// POST /gbv-reports             — file new report
export interface CreateGBVReportRequest {
  patientId: string;
  incidentDate?: string;
  incidentType: "physical" | "sexual" | "emotional" | "economic" | "other";
  description: string;
  perpetratorRelation?: string;
  injuries?: string;
  safetyPlan: string;
  referrals: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  confidentialityLevel: "standard" | "high" | "restricted";
  attachments?: File[];           // uploaded files
}

// PATCH /gbv-reports/:id        — update report
export interface UpdateGBVReportRequest {
  description?: string;
  injuries?: string;
  safetyPlan?: string;
  referrals?: string[];
  followUpRequired?: boolean;
  followUpDate?: string;
  status?: "open" | "in_progress" | "referred" | "closed";
  confidentialityLevel?: "standard" | "high" | "restricted";
}

// DELETE /gbv-reports/:id       — delete report (admin only, audit-logged)

// ---------------------------------------------------------------------------
// 8. TELECONSULT  —  /api/v1/teleconsults
// ---------------------------------------------------------------------------

export interface TeleconsultResponse {
  id: string;
  patientId: string;
  patientName: string;
  requestedBy: string;
  requestedById: string;
  requestDate: string;
  priority: "routine" | "urgent" | "emergency";
  consultationType:
    | "general"
    | "high_risk"
    | "ultrasound_review"
    | "gbv"
    | "complication";
  chiefComplaint: string;
  clinicalNotes: string;
  attachments: {
    id: string;
    type: "visit_notes" | "ultrasound" | "lab_results" | "other";
    url: string;
    name: string;
  }[];
  assignedSpecialist?: string;
  assignedSpecialistId?: string;
  status: "pending" | "assigned" | "in_review" | "responded" | "closed";
  response?: {
    respondedBy: string;
    respondedById: string;
    respondedAt: string;
    diagnosis?: string;
    recommendations: string;
    followUpInstructions: string;
    prescriptions?: string[];
  };
  syncStatus: SyncStatus;
  createdAt: string;
}

// GET  /teleconsults             — list teleconsult requests
//   Query: ?patientId=p4&priority=emergency&status=pending
//          &consultationType=high_risk&assignedSpecialistId=u1
// GET  /teleconsults/:id         — single request

// POST /teleconsults             — create teleconsult request
//   Content-Type: multipart/form-data (when attaching files)
export interface CreateTeleconsultRequest {
  patientId: string;
  priority: "routine" | "urgent" | "emergency";
  consultationType:
    | "general"
    | "high_risk"
    | "ultrasound_review"
    | "gbv"
    | "complication";
  chiefComplaint: string;
  clinicalNotes: string;
  attachments?: File[];
}

// PATCH /teleconsults/:id        — update request (assign specialist, change status)
export interface UpdateTeleconsultRequest {
  priority?: "routine" | "urgent" | "emergency";
  assignedSpecialistId?: string;
  status?: "pending" | "assigned" | "in_review" | "responded" | "closed";
  clinicalNotes?: string;
}

// POST /teleconsults/:id/respond — specialist submits response
export interface TeleconsultRespondRequest {
  diagnosis?: string;
  recommendations: string;
  followUpInstructions: string;
  prescriptions?: string[];
}

// DELETE /teleconsults/:id       — cancel/delete request

// ---------------------------------------------------------------------------
// 9. ALERTS  —  /api/v1/alerts
// ---------------------------------------------------------------------------

export interface AlertResponse {
  id: string;
  type: "appointment" | "risk" | "teleconsult" | "sync" | "system" | "gbv";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  patientId?: string;
  patientName?: string;
  createdAt: string;
  readAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  actionRequired: boolean;
  actionUrl?: string;
}

// GET  /alerts                   — list alerts for current user
//   Query: ?type=risk&priority=critical&actionRequired=true&unreadOnly=true
// GET  /alerts/count             — unread count  → { unread: number, actionRequired: number }
// GET  /alerts/:id               — single alert

// PATCH /alerts/:id/read         — mark as read  (body: {})
// PATCH /alerts/:id/acknowledge  — acknowledge   (body: {})
// PATCH /alerts/read-all         — mark all as read

// POST /alerts                   — create alert (system/admin use)
export interface CreateAlertRequest {
  type: "appointment" | "risk" | "teleconsult" | "sync" | "system" | "gbv";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  patientId?: string;
  actionRequired: boolean;
  actionUrl?: string;
  targetUserIds?: string[];       // who should see this alert
}

// DELETE /alerts/:id             — dismiss/delete alert

// ---------------------------------------------------------------------------
// 10. APPOINTMENTS  —  /api/v1/appointments
// ---------------------------------------------------------------------------

export interface AppointmentResponse {
  id: string;
  patientId: string;
  patientName: string;
  type: "prenatal_checkup" | "ultrasound" | "lab_test" | "follow_up" | "teleconsult";
  visitNumber?: number;
  gestationalAge?: { weeks: number; days: number };
  scheduledDate: string;
  scheduledTime: string;
  clinicId: string;
  clinicName: string;
  midwifeId: string;
  midwifeName: string;
  priority: "routine" | "urgent" | "emergency";
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "missed" | "cancelled";
  notes?: string;
  createdAt: string;
}

// GET  /appointments             — list appointments
//   Query: ?clinicId=c1&midwifeId=u2&date=2024-12-01
//          &status=scheduled&patientId=p1&from=...&to=...
// GET  /appointments/today       — today's appointments for the user's clinic
// GET  /appointments/:id         — single appointment

// POST /appointments             — schedule appointment
export interface CreateAppointmentRequest {
  patientId: string;
  type: "prenatal_checkup" | "ultrasound" | "lab_test" | "follow_up" | "teleconsult";
  scheduledDate: string;
  scheduledTime: string;
  clinicId: string;
  midwifeId: string;
  priority: "routine" | "urgent" | "emergency";
  notes?: string;
}

// PATCH /appointments/:id        — update appointment
export interface UpdateAppointmentRequest {
  scheduledDate?: string;
  scheduledTime?: string;
  status?: "scheduled" | "confirmed" | "in_progress" | "completed" | "missed" | "cancelled";
  notes?: string;
}

// DELETE /appointments/:id       — cancel appointment

// ---------------------------------------------------------------------------
// 11. ANALYTICS  —  /api/v1/analytics
// ---------------------------------------------------------------------------

// GET /analytics/dashboard-stats — clinic-wide stats for the dashboard
export interface DashboardStatsResponse {
  totalPatients: number;
  activePregnancies: number;
  highRiskPatients: number;
  visitsThisMonth: number;
  teleconsultsThisMonth: number;
  gbvReportsThisMonth: number;
  syncPendingCount: number;
  appointmentsToday: number;
}

// GET /analytics/visits-by-month — monthly visit trend
//   Query: ?months=6&clinicId=c1
export interface VisitsByMonthResponse {
  data: { month: string; visits: number; newPatients: number }[];
}

// GET /analytics/risk-distribution — patient risk level breakdown
//   Query: ?clinicId=c1
export interface RiskDistributionResponse {
  data: { level: string; count: number }[];
}

// GET /analytics/top-risk-factors — most common risk factors
//   Query: ?limit=10&clinicId=c1
export interface TopRiskFactorsResponse {
  data: { factor: string; count: number }[];
}

// GET /analytics/gestational-age-distribution
//   Query: ?clinicId=c1
export interface GestationalAgeDistributionResponse {
  data: { range: string; count: number }[];
}

// GET /analytics/teleconsult-metrics
//   Query: ?from=2024-01-01&to=2024-12-31
export interface TeleconsultMetricsResponse {
  totalRequests: number;
  avgResponseTime: number;
  pendingCount: number;
  resolvedCount: number;
}

// GET /analytics/overview — combined analytics (all the above in one call)
export interface AnalyticsOverviewResponse {
  dashboardStats: DashboardStatsResponse;
  visitsByMonth: VisitsByMonthResponse["data"];
  riskDistribution: RiskDistributionResponse["data"];
  topRiskFactors: TopRiskFactorsResponse["data"];
  gestationalAgeDistribution: GestationalAgeDistributionResponse["data"];
  teleconsultMetrics: TeleconsultMetricsResponse;
}

// ---------------------------------------------------------------------------
// 12. SYNC  —  /api/v1/sync
// ---------------------------------------------------------------------------

// GET  /sync/status              — current sync status
export interface SyncStatusResponse {
  lastSyncTime: string;
  pendingUploads: number;
  pendingDownloads: number;
  conflicts: number;
  isOnline: boolean;
  syncProgress?: number;
  lastError?: string;
}

// POST /sync/trigger             — trigger a sync
//   Response: 202 Accepted + SyncStatusResponse (with syncProgress)

// GET  /sync/queue               — pending sync items
export interface SyncQueueItemResponse {
  id: string;
  type: "patient" | "visit" | "ultrasound" | "gbv_report" | "teleconsult";
  action: "create" | "update" | "delete";
  patientName?: string;
  status: "pending" | "uploading" | "downloading" | "completed" | "failed";
  timestamp: string;
  progress?: number;
}

// GET  /sync/conflicts           — unresolved sync conflicts
export interface SyncConflictResponse {
  id: string;
  patientId: string;
  patientName: string;
  field: string;
  localValue: string;
  serverValue: string;
  localTimestamp: string;
  serverTimestamp: string;
}

// POST /sync/conflicts/:id/resolve — resolve a conflict
export interface ResolveSyncConflictRequest {
  resolution: "keep_local" | "keep_server" | "merge";
  mergedValue?: string;           // required when resolution is "merge"
}

// ---------------------------------------------------------------------------
// 13. ACTIVITY LOG  —  /api/v1/activity
// ---------------------------------------------------------------------------

export interface ActivityResponse {
  id: string;
  type: "visit" | "registration" | "teleconsult" | "risk_update" | "sync" | "gbv" | "ultrasound";
  description: string;
  userId: string;
  userName: string;
  patientId?: string;
  patientName?: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

// GET  /activity                 — recent activity feed
//   Query: ?type=visit&userId=u2&patientId=p1&limit=20

// ---------------------------------------------------------------------------
// 14. SETTINGS  —  /api/v1/settings
// ---------------------------------------------------------------------------

// GET  /settings/profile         — current user profile settings
// PATCH /settings/profile        — update profile
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar?: File;
}

// GET  /settings/notifications   — notification preferences
// PATCH /settings/notifications
export interface NotificationPreferences {
  emailAlerts: boolean;
  smsAlerts: boolean;
  criticalOnly: boolean;
  alertTypes: {
    appointment: boolean;
    risk: boolean;
    teleconsult: boolean;
    sync: boolean;
    system: boolean;
    gbv: boolean;
  };
}

// GET  /settings/security        — security settings (2FA status, sessions)
// PATCH /settings/security
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;         // minutes
  activeSessions: {
    id: string;
    device: string;
    ip: string;
    lastActive: string;
  }[];
}

// DELETE /settings/security/sessions/:id — revoke a session

// ---------------------------------------------------------------------------
// 15. FILE UPLOAD  —  /api/v1/files
// ---------------------------------------------------------------------------

// POST /files/upload
//   Content-Type: multipart/form-data
//   Body: { file: File, category: "ultrasound" | "attachment" | "avatar" | "document" }
export interface FileUploadResponse {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  mimeType: string;
  category: string;
  uploadedAt: string;
}

// GET  /files/:id                — get file metadata
// DELETE /files/:id              — delete file

// ---------------------------------------------------------------------------
// 16. RISK ASSESSMENT  —  /api/v1/risk
// ---------------------------------------------------------------------------

// GET  /risk/patients            — list high-risk patients with scores
//   Query: ?minScore=50&riskLevel=critical&clinicId=c1
// Response: PatientResponse[] (filtered to high risk)

// GET  /risk/rules               — risk scoring rules
export interface RiskRuleResponse {
  id: string;
  name: string;
  description: string;
  condition: string;
  weight: number;
  version: string;
  isActive: boolean;
}

// POST /risk/rules               — create rule (admin only)
export interface CreateRiskRuleRequest {
  name: string;
  description: string;
  condition: string;
  weight: number;
}

// PATCH /risk/rules/:id          — update rule
export interface UpdateRiskRuleRequest {
  name?: string;
  description?: string;
  condition?: string;
  weight?: number;
  isActive?: boolean;
}

// POST /risk/calculate/:patientId — recalculate risk score for a patient
export interface RiskCalculationResponse {
  patientId: string;
  previousScore: number;
  newScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  matchedRules: { ruleId: string; ruleName: string; weight: number }[];
}

// DELETE /risk/rules/:id         — deactivate rule
