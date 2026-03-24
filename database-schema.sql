-- ============================================================================
-- UNFPA Digital Maternity Package (DMP) — Database Schema
-- PostgreSQL
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
  'midwife', 'nurse', 'doctor', 'specialist',
  'admin', 'health_authority', 'partner_analyst', 'gbv_officer'
);

CREATE TYPE user_status AS ENUM ('online', 'offline', 'away');

CREATE TYPE clinic_type AS ENUM ('fixed', 'mobile');

CREATE TYPE clinic_status AS ENUM ('active', 'inactive');

CREATE TYPE pregnancy_status AS ENUM ('pregnant', 'postpartum', 'not_pregnant');

CREATE TYPE hiv_status AS ENUM ('positive', 'negative', 'unknown');

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'conflict');

CREATE TYPE ultrasound_quality AS ENUM ('excellent', 'good', 'fair', 'poor');

CREATE TYPE review_status AS ENUM ('pending', 'reviewed', 'flagged');

CREATE TYPE gbv_incident_type AS ENUM ('physical', 'sexual', 'emotional', 'economic', 'other');

CREATE TYPE gbv_case_status AS ENUM ('open', 'in_progress', 'referred', 'closed');

CREATE TYPE confidentiality_level AS ENUM ('standard', 'high', 'restricted');

CREATE TYPE consult_priority AS ENUM ('routine', 'urgent', 'emergency');

CREATE TYPE consultation_type AS ENUM ('general', 'high_risk', 'ultrasound_review', 'gbv', 'complication');

CREATE TYPE consult_status AS ENUM ('pending', 'assigned', 'in_review', 'responded', 'closed');

CREATE TYPE alert_type AS ENUM ('appointment', 'risk', 'teleconsult', 'sync', 'system', 'gbv');

CREATE TYPE alert_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE appointment_type AS ENUM ('prenatal_checkup', 'ultrasound', 'lab_test', 'follow_up', 'teleconsult');

CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'missed', 'cancelled');

CREATE TYPE activity_type AS ENUM ('visit', 'registration', 'teleconsult', 'risk_update', 'sync', 'gbv', 'ultrasound');

CREATE TYPE sync_queue_action AS ENUM ('create', 'update', 'delete');

CREATE TYPE sync_queue_status AS ENUM ('pending', 'uploading', 'downloading', 'completed', 'failed');

CREATE TYPE file_category AS ENUM ('ultrasound', 'attachment', 'avatar', 'document');

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

-- 1. USERS
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL,
  avatar_url    TEXT,
  clinic_id     UUID REFERENCES clinics(id) ON DELETE SET NULL,
  status        user_status NOT NULL DEFAULT 'offline',
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_clinic ON users(clinic_id);

-- 2. REFRESH TOKENS
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- 3. CLINICS
CREATE TABLE clinics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  location      VARCHAR(255) NOT NULL,
  region        VARCHAR(100) NOT NULL,
  zone          VARCHAR(100) NOT NULL,
  woreda        VARCHAR(100) NOT NULL,
  type          clinic_type NOT NULL,
  status        clinic_status NOT NULL DEFAULT 'active',
  patient_count INTEGER NOT NULL DEFAULT 0,
  last_sync     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clinics_region ON clinics(region);
CREATE INDEX idx_clinics_status ON clinics(status);

-- 4. PATIENTS
CREATE TABLE patients (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name         VARCHAR(255) NOT NULL,
  date_of_birth     DATE NOT NULL,
  id_number         VARCHAR(50) NOT NULL UNIQUE,
  phone_number      VARCHAR(20),
  address           TEXT NOT NULL,
  village           VARCHAR(255) NOT NULL,
  emergency_contact VARCHAR(255) NOT NULL,
  emergency_phone   VARCHAR(20) NOT NULL,
  pregnancy_status  pregnancy_status NOT NULL,
  gravida           INTEGER NOT NULL,
  para              INTEGER NOT NULL,
  lmp_date          DATE,
  edd_date          DATE,
  blood_type        VARCHAR(5),
  hiv_status        hiv_status DEFAULT 'unknown',
  risk_level        risk_level NOT NULL DEFAULT 'low',
  risk_score        INTEGER NOT NULL DEFAULT 0,
  risk_factors      TEXT[] DEFAULT '{}',
  last_visit        TIMESTAMPTZ,
  assigned_midwife_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sync_status       sync_status NOT NULL DEFAULT 'pending',
  clinic_id         UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  is_archived       BOOLEAN NOT NULL DEFAULT FALSE,
  registered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_risk ON patients(risk_level);
CREATE INDEX idx_patients_pregnancy ON patients(pregnancy_status);
CREATE INDEX idx_patients_midwife ON patients(assigned_midwife_id);
CREATE INDEX idx_patients_sync ON patients(sync_status);
CREATE INDEX idx_patients_id_number ON patients(id_number);

-- 5. PRENATAL VISITS
CREATE TABLE prenatal_visits (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_date              TIMESTAMPTZ NOT NULL,
  visit_number            INTEGER NOT NULL,
  gestational_age_weeks   INTEGER NOT NULL,
  gestational_age_days    INTEGER NOT NULL DEFAULT 0,
  bp_systolic             INTEGER NOT NULL,
  bp_diastolic            INTEGER NOT NULL,
  weight                  DECIMAL(5,1) NOT NULL,
  temperature             DECIMAL(4,1) NOT NULL,
  pulse                   INTEGER NOT NULL,
  respiratory_rate        INTEGER NOT NULL,
  fetal_heart_rate        INTEGER,
  fundal_height           DECIMAL(4,1),
  symptoms                TEXT[] DEFAULT '{}',
  medications             TEXT[] DEFAULT '{}',
  hemoglobin              DECIMAL(4,1),
  urinalysis              VARCHAR(100),
  glucose_level           DECIMAL(5,1),
  notes                   TEXT NOT NULL DEFAULT '',
  next_appointment        TIMESTAMPTZ,
  risk_flags              TEXT[] DEFAULT '{}',
  conducted_by_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  sync_status             sync_status NOT NULL DEFAULT 'pending',
  clinic_id               UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visits_patient ON prenatal_visits(patient_id);
CREATE INDEX idx_visits_date ON prenatal_visits(visit_date);
CREATE INDEX idx_visits_clinic ON prenatal_visits(clinic_id);
CREATE INDEX idx_visits_conductor ON prenatal_visits(conducted_by_id);

-- 6. ULTRASOUND IMAGES
CREATE TABLE ultrasound_images (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id            UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id              UUID REFERENCES prenatal_visits(id) ON DELETE SET NULL,
  capture_date          TIMESTAMPTZ NOT NULL,
  image_url             TEXT NOT NULL,
  thumbnail_url         TEXT NOT NULL,
  gestational_age_weeks INTEGER NOT NULL,
  gestational_age_days  INTEGER NOT NULL DEFAULT 0,
  findings              TEXT NOT NULL DEFAULT '',
  annotations           TEXT[] DEFAULT '{}',
  bpd                   DECIMAL(5,1),
  fl                    DECIMAL(5,1),
  ac                    DECIMAL(5,1),
  hc                    DECIMAL(5,1),
  efw                   DECIMAL(6,1),
  quality               ultrasound_quality NOT NULL,
  captured_by_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  review_status         review_status NOT NULL DEFAULT 'pending',
  sync_status           sync_status NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ultrasounds_patient ON ultrasound_images(patient_id);
CREATE INDEX idx_ultrasounds_review ON ultrasound_images(review_status);
CREATE INDEX idx_ultrasounds_captured_by ON ultrasound_images(captured_by_id);

-- 7. GBV REPORTS
CREATE TABLE gbv_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id            UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  report_date           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  incident_date         DATE,
  incident_type         gbv_incident_type NOT NULL,
  description           TEXT NOT NULL,
  perpetrator_relation  VARCHAR(255),
  injuries              TEXT,
  safety_plan           TEXT NOT NULL,
  referrals             TEXT[] DEFAULT '{}',
  follow_up_required    BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_date        DATE,
  status                gbv_case_status NOT NULL DEFAULT 'open',
  confidentiality_level confidentiality_level NOT NULL DEFAULT 'standard',
  reported_by_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  sync_status           sync_status NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gbv_patient ON gbv_reports(patient_id);
CREATE INDEX idx_gbv_status ON gbv_reports(status);
CREATE INDEX idx_gbv_confidentiality ON gbv_reports(confidentiality_level);
CREATE INDEX idx_gbv_follow_up ON gbv_reports(follow_up_required, follow_up_date);

-- 8. GBV ATTACHMENTS
CREATE TABLE gbv_attachments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gbv_report_id UUID NOT NULL REFERENCES gbv_reports(id) ON DELETE CASCADE,
  file_id       UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TELECONSULT REQUESTS
CREATE TABLE teleconsult_requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id            UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  requested_by_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  request_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  priority              consult_priority NOT NULL,
  consultation_type     consultation_type NOT NULL,
  chief_complaint       TEXT NOT NULL,
  clinical_notes        TEXT NOT NULL DEFAULT '',
  assigned_specialist_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status                consult_status NOT NULL DEFAULT 'pending',
  sync_status           sync_status NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teleconsults_patient ON teleconsult_requests(patient_id);
CREATE INDEX idx_teleconsults_status ON teleconsult_requests(status);
CREATE INDEX idx_teleconsults_priority ON teleconsult_requests(priority);
CREATE INDEX idx_teleconsults_specialist ON teleconsult_requests(assigned_specialist_id);

-- 10. TELECONSULT ATTACHMENTS
CREATE TABLE teleconsult_attachments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teleconsult_id      UUID NOT NULL REFERENCES teleconsult_requests(id) ON DELETE CASCADE,
  type                VARCHAR(50) NOT NULL,
  file_url            TEXT NOT NULL,
  file_name           VARCHAR(255) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TELECONSULT RESPONSES
CREATE TABLE teleconsult_responses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teleconsult_id        UUID NOT NULL UNIQUE REFERENCES teleconsult_requests(id) ON DELETE CASCADE,
  responded_by_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  responded_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  diagnosis             TEXT,
  recommendations       TEXT NOT NULL,
  follow_up_instructions TEXT NOT NULL,
  prescriptions         TEXT[] DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ALERTS
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            alert_type NOT NULL,
  priority        alert_priority NOT NULL,
  title           VARCHAR(255) NOT NULL,
  message         TEXT NOT NULL,
  patient_id      UUID REFERENCES patients(id) ON DELETE SET NULL,
  target_user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  action_required BOOLEAN NOT NULL DEFAULT FALSE,
  action_url      VARCHAR(500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON alerts(target_user_id);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_unread ON alerts(target_user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_alerts_patient ON alerts(patient_id);

-- 13. APPOINTMENTS
CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type            appointment_type NOT NULL,
  visit_number    INTEGER,
  scheduled_date  DATE NOT NULL,
  scheduled_time  TIME NOT NULL,
  clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  midwife_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  priority        consult_priority NOT NULL DEFAULT 'routine',
  status          appointment_status NOT NULL DEFAULT 'scheduled',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_appointments_midwife ON appointments(midwife_id);
CREATE INDEX idx_appointments_status ON appointments(status);

-- 14. ACTIVITY LOG
CREATE TABLE activity_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type          activity_type NOT NULL,
  description   TEXT NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id    UUID REFERENCES patients(id) ON DELETE SET NULL,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_patient ON activity_log(patient_id);
CREATE INDEX idx_activity_type ON activity_log(type);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- 15. SYNC QUEUE
CREATE TABLE sync_queue (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type   VARCHAR(50) NOT NULL,
  entity_id     UUID NOT NULL,
  action        sync_queue_action NOT NULL,
  status        sync_queue_status NOT NULL DEFAULT 'pending',
  payload       JSONB,
  progress      INTEGER DEFAULT 0,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_queue_status ON sync_queue(status);

-- 16. SYNC CONFLICTS
CREATE TABLE sync_conflicts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  field            VARCHAR(100) NOT NULL,
  local_value      TEXT NOT NULL,
  server_value     TEXT NOT NULL,
  local_timestamp  TIMESTAMPTZ NOT NULL,
  server_timestamp TIMESTAMPTZ NOT NULL,
  resolved         BOOLEAN NOT NULL DEFAULT FALSE,
  resolution       VARCHAR(20),
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conflicts_unresolved ON sync_conflicts(resolved) WHERE resolved = FALSE;

-- 17. FILES
CREATE TABLE files (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename      VARCHAR(255) NOT NULL,
  url           TEXT NOT NULL,
  thumbnail_url TEXT,
  size          BIGINT NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  category      file_category NOT NULL,
  uploaded_by   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. RISK RULES
CREATE TABLE risk_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  condition   TEXT NOT NULL,
  weight      INTEGER NOT NULL,
  version     VARCHAR(20) NOT NULL DEFAULT '1.0',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. NOTIFICATION PREFERENCES
CREATE TABLE notification_preferences (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_alerts      BOOLEAN NOT NULL DEFAULT TRUE,
  sms_alerts        BOOLEAN NOT NULL DEFAULT FALSE,
  critical_only     BOOLEAN NOT NULL DEFAULT FALSE,
  alert_appointment BOOLEAN NOT NULL DEFAULT TRUE,
  alert_risk        BOOLEAN NOT NULL DEFAULT TRUE,
  alert_teleconsult BOOLEAN NOT NULL DEFAULT TRUE,
  alert_sync        BOOLEAN NOT NULL DEFAULT TRUE,
  alert_system      BOOLEAN NOT NULL DEFAULT TRUE,
  alert_gbv         BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. USER SESSIONS
CREATE TABLE user_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device      VARCHAR(255),
  ip_address  INET,
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);

-- ---------------------------------------------------------------------------
-- TRIGGER: auto-update updated_at columns
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated       BEFORE UPDATE ON users              FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clinics_updated      BEFORE UPDATE ON clinics            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_updated     BEFORE UPDATE ON patients           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_visits_updated       BEFORE UPDATE ON prenatal_visits    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ultrasounds_updated  BEFORE UPDATE ON ultrasound_images  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_gbv_updated          BEFORE UPDATE ON gbv_reports        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_teleconsults_updated BEFORE UPDATE ON teleconsult_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON appointments       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_risk_rules_updated   BEFORE UPDATE ON risk_rules         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sync_queue_updated   BEFORE UPDATE ON sync_queue         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
