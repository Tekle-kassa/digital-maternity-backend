# UNFPA DMP — API Reference

Base URL: `/api/v1`

All endpoints require a Bearer JWT token unless marked **public**.

---

## Quick Summary

| # | Domain | Endpoints | Description |
|---|--------|-----------|-------------|
| 1 | Auth | 5 | Login, logout, token refresh, password reset |
| 2 | Users | 6 | User CRUD, current user, password change |
| 3 | Clinics | 5 | Clinic CRUD, per-clinic stats |
| 4 | Patients | 9 | Patient CRUD, sub-resources (visits, ultrasounds, etc.) |
| 5 | Prenatal Visits | 4 | Visit CRUD |
| 6 | Ultrasound | 4 | Upload, review, CRUD |
| 7 | GBV Reports | 4 | Report CRUD (access-controlled) |
| 8 | Teleconsult | 5 | Request CRUD, specialist response |
| 9 | Alerts | 6 | Alert CRUD, read/acknowledge, counts |
| 10 | Appointments | 5 | Schedule, update, today's list |
| 11 | Analytics | 7 | Dashboard stats, charts, metrics |
| 12 | Sync | 4 | Sync trigger, status, queue, conflicts |
| 13 | Activity | 1 | Activity feed |
| 14 | Settings | 5 | Profile, notifications, security |
| 15 | Files | 3 | Upload, metadata, delete |
| 16 | Risk | 5 | Risk patients, rules, score calculation |

**Total: ~78 endpoints**

---

## 1. Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Login with email/password | public |
| POST | `/auth/refresh` | Refresh access token | public |
| POST | `/auth/logout` | Invalidate tokens | yes |
| POST | `/auth/forgot-password` | Send password reset email | public |
| POST | `/auth/reset-password` | Reset password with token | public |

---

## 2. Users

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/users` | List all users | admin |
| GET | `/users/me` | Current user profile | any |
| GET | `/users/:id` | Get user by ID | admin |
| POST | `/users` | Create user | admin |
| PATCH | `/users/:id` | Update user | admin |
| PATCH | `/users/me/password` | Change own password | any |
| DELETE | `/users/:id` | Deactivate user | admin |

---

## 3. Clinics

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/clinics` | List clinics | any |
| GET | `/clinics/:id` | Get clinic details | any |
| GET | `/clinics/:id/stats` | Per-clinic statistics | any |
| POST | `/clinics` | Create clinic | admin |
| PATCH | `/clinics/:id` | Update clinic | admin |
| DELETE | `/clinics/:id` | Deactivate clinic | admin |

**Query params:** `region`, `zone`, `woreda`, `type`, `status`

---

## 4. Patients

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/patients` | List patients (paginated) | any |
| GET | `/patients/:id` | Patient details | any |
| POST | `/patients` | Register new patient | midwife, nurse, doctor |
| PATCH | `/patients/:id` | Update patient | midwife, nurse, doctor |
| DELETE | `/patients/:id` | Archive patient | admin |
| GET | `/patients/:id/visits` | Patient's prenatal visits | any |
| GET | `/patients/:id/ultrasounds` | Patient's ultrasound records | any |
| GET | `/patients/:id/teleconsults` | Patient's teleconsult requests | any |
| GET | `/patients/:id/gbv-reports` | Patient's GBV reports | gbv_officer, doctor, admin |
| GET | `/patients/:id/alerts` | Patient-related alerts | any |

**Query params:** `clinicId`, `riskLevel`, `pregnancyStatus`, `assignedMidwifeId`, `syncStatus`, `search`

---

## 5. Prenatal Visits

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/visits` | List visits (paginated) | any |
| GET | `/visits/:id` | Visit details | any |
| POST | `/visits` | Record new visit | midwife, nurse, doctor |
| PATCH | `/visits/:id` | Update visit | midwife, nurse, doctor |
| DELETE | `/visits/:id` | Delete visit | admin |

**Query params:** `patientId`, `clinicId`, `conductedById`, `from`, `to`

---

## 6. Ultrasound

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/ultrasounds` | List ultrasound records | any |
| GET | `/ultrasounds/:id` | Ultrasound details | any |
| POST | `/ultrasounds` | Upload ultrasound (multipart) | midwife, nurse, doctor |
| PATCH | `/ultrasounds/:id` | Update/review ultrasound | doctor, specialist |
| DELETE | `/ultrasounds/:id` | Delete record | admin |

**Query params:** `patientId`, `reviewStatus`, `quality`, `capturedById`

---

## 7. GBV Reports

> Access restricted to `gbv_officer`, `doctor`, `admin` roles.
> Reports with `confidentialityLevel: "restricted"` have additional access limits.

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/gbv-reports` | List GBV reports | gbv_officer, doctor, admin |
| GET | `/gbv-reports/:id` | Report details | gbv_officer, doctor, admin |
| POST | `/gbv-reports` | File new report | gbv_officer, doctor, midwife |
| PATCH | `/gbv-reports/:id` | Update report | gbv_officer, doctor |
| DELETE | `/gbv-reports/:id` | Delete report (audit-logged) | admin |

**Query params:** `patientId`, `status`, `incidentType`, `confidentialityLevel`, `followUpRequired`

---

## 8. Teleconsult

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/teleconsults` | List requests | any |
| GET | `/teleconsults/:id` | Request details | any |
| POST | `/teleconsults` | Create request (multipart) | midwife, nurse, doctor |
| PATCH | `/teleconsults/:id` | Update/assign specialist | doctor, admin |
| POST | `/teleconsults/:id/respond` | Specialist submits response | specialist, doctor |
| DELETE | `/teleconsults/:id` | Cancel request | requester, admin |

**Query params:** `patientId`, `priority`, `status`, `consultationType`, `assignedSpecialistId`

---

## 9. Alerts

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/alerts` | List alerts for current user | any |
| GET | `/alerts/count` | Unread & action-required counts | any |
| GET | `/alerts/:id` | Single alert | any |
| PATCH | `/alerts/:id/read` | Mark as read | any |
| PATCH | `/alerts/:id/acknowledge` | Acknowledge alert | any |
| PATCH | `/alerts/read-all` | Mark all as read | any |
| POST | `/alerts` | Create alert (system use) | admin, system |
| DELETE | `/alerts/:id` | Dismiss alert | any |

**Query params:** `type`, `priority`, `actionRequired`, `unreadOnly`

---

## 10. Appointments

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/appointments` | List appointments | any |
| GET | `/appointments/today` | Today's appointments | any |
| GET | `/appointments/:id` | Appointment details | any |
| POST | `/appointments` | Schedule appointment | midwife, nurse, doctor |
| PATCH | `/appointments/:id` | Update appointment | midwife, nurse, doctor |
| DELETE | `/appointments/:id` | Cancel appointment | any |

**Query params:** `clinicId`, `midwifeId`, `date`, `status`, `patientId`, `from`, `to`

---

## 11. Analytics

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/analytics/overview` | All analytics combined | any |
| GET | `/analytics/dashboard-stats` | Summary stat cards | any |
| GET | `/analytics/visits-by-month` | Monthly visit trends | any |
| GET | `/analytics/risk-distribution` | Risk level breakdown | any |
| GET | `/analytics/top-risk-factors` | Common risk factors | any |
| GET | `/analytics/gestational-age-distribution` | GA distribution | any |
| GET | `/analytics/teleconsult-metrics` | Teleconsult KPIs | any |

**Query params:** `clinicId`, `months`, `from`, `to`, `limit`

---

## 12. Sync

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/sync/status` | Current sync status | any |
| POST | `/sync/trigger` | Trigger manual sync | any |
| GET | `/sync/queue` | Pending sync items | any |
| GET | `/sync/conflicts` | Unresolved conflicts | any |
| POST | `/sync/conflicts/:id/resolve` | Resolve a conflict | any |

---

## 13. Activity Log

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/activity` | Recent activity feed | any |

**Query params:** `type`, `userId`, `patientId`, `limit`

---

## 14. Settings

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/settings/profile` | User profile | any |
| PATCH | `/settings/profile` | Update profile | any |
| GET | `/settings/notifications` | Notification preferences | any |
| PATCH | `/settings/notifications` | Update preferences | any |
| GET | `/settings/security` | Security settings & sessions | any |
| PATCH | `/settings/security` | Update security settings | any |
| DELETE | `/settings/security/sessions/:id` | Revoke session | any |

---

## 15. File Upload

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/files/upload` | Upload file (multipart) | any |
| GET | `/files/:id` | File metadata | any |
| DELETE | `/files/:id` | Delete file | uploader, admin |

---

## 16. Risk Assessment

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/risk/patients` | High-risk patients list | any |
| GET | `/risk/rules` | Risk scoring rules | any |
| POST | `/risk/rules` | Create rule | admin |
| PATCH | `/risk/rules/:id` | Update rule | admin |
| DELETE | `/risk/rules/:id` | Deactivate rule | admin |
| POST | `/risk/calculate/:patientId` | Recalculate risk score | doctor, admin |

**Query params (patients):** `minScore`, `riskLevel`, `clinicId`

---

## Standard Patterns

### Pagination
All list endpoints accept: `page` (default 1), `limit` (default 20, max 100), `sort`, `order` (asc/desc).

Response includes:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Responses
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "email": ["Must be a valid email address"]
    }
  }
}
```

### HTTP Status Codes
| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async operations like sync) |
| 204 | No Content (logout, deletes) |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not authorized (role insufficient) |
| 404 | Not found |
| 409 | Conflict (duplicate, sync conflict) |
| 422 | Unprocessable entity |
| 500 | Server error |
