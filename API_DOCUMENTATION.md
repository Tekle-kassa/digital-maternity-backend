# Digital Maternity Backend API Documentation

## Swagger UI Access

Once the server is running, you can access the interactive Swagger API documentation at:

**http://localhost:3000/api-docs**

## API Base URL

All API endpoints are prefixed with `/api/v1`

## Authentication

Most endpoints require JWT Bearer token authentication. To authenticate:

1. Use the `/api/v1/auth/login` endpoint to get an access token
2. Include the token in the Authorization header: `Authorization: Bearer <token>`

## API flow and steps

Typical order of API calls for the maternity journey:

---

### Step 0 – Setup (one-time or admin)

| Step | API | Purpose |
|------|-----|---------|
| 0.1 | `POST /api/v1/auth/register` | Create a user (e.g. midwife, doctor). |
| 0.2 | `POST /api/v1/role/assign` | Assign role to user (e.g. MIDWIFE, DOCTOR). |
| 0.3 | `POST /api/v1/auth/login` | Get access (and refresh) token for all later requests. |

Use the **access token** in the `Authorization: Bearer <token>` header for every request below.

---

### Step 1 – Register the client

**Option A – One request (recommended, matches Register Client UI)**

| Step | API | Purpose |
|------|-----|---------|
| 1.1 | `POST /api/v1/patient/register-client` | Send the full Register Client form (consent, basic info, past obstetric, medical history, lab, supplement, exams, counseling, HIV, follow-up). Creates **Patient** + **ANC record** in one go. |

Response gives you `patient.id` and `ancRecord.id`.

**Option B – Two requests**

| Step | API | Purpose |
|------|-----|---------|
| 1.1 | `POST /api/v1/patient` | Create patient (basic info only). Get `patient.id`. |
| 1.2 | `POST /api/v1/anc` | Create ANC record with `patientId` and all ANC/consent/history/lab/exam fields. |

---

### Step 2 – ANC visits and follow-up

| Step | API | Purpose |
|------|-----|---------|
| 2.1 | `POST /api/v1/visit` | Create an ANC visit (e.g. visit date, BP, weight, symptoms, notes). Send `patientId`; optionally `pregnancyId` if you use pregnancies. |
| 2.2 | `GET /api/v1/visit/patient/:patientId` | List all visits for the client. |
| 2.3 | `PATCH /api/v1/anc/:id` | Update ANC record (e.g. new lab results, follow-up data) when needed. |

Ultrasound and referrals can be done in parallel when needed:

| Step | API | Purpose |
|------|-----|---------|
| 2.4 | `POST /api/v1/ultrasound` | Add an ultrasound (image + metadata), linked to `patientId` and optionally `visitId`. |
| 2.5 | `POST /api/v1/referral` | Create a referral for the patient if they are referred out. |

---

### Step 3 – Delivery

| Step | API | Purpose |
|------|-----|---------|
| 3.1 | `POST /api/v1/delivery` | Create delivery (date, time, AMTSL, placenta, etc.). Use **`patientId` only** (no `pregnancyId`). In the same body you can send **newborns** (e.g. sex, birth weight, Apgar, vit K, etc.). |
| 3.2 | `GET /api/v1/delivery/patient/:patientId` | List deliveries for the client. |
| 3.3 | `GET /api/v1/delivery/:id` | Get one delivery (with newborns) if needed. |

---

### Step 4 – Postnatal (PNC)

| Step | API | Purpose |
|------|-----|---------|
| 4.1 | `POST /api/v1/pnc` | Create a PNC visit (BP, TPR, uterus, baby feeding, HIV, etc.). Send `patientId` and optionally `deliveryId`. |
| 4.2 | `GET /api/v1/pnc/patient/:patientId` | List PNC visits for the client. |
| 4.3 | `GET /api/v1/pnc/delivery/:deliveryId` | List PNC visits for a specific delivery. |

---

### Other flows (when needed)

- **GBV:** `POST /api/v1/gbv` (report) then `POST /api/v1/gbv-screening` (screening linked to report or patient).
- **SRH:** `POST /api/v1/srh` with `patientId` for SRH registration.
- **Analytics:** `GET /api/v1/analytics/...` for dashboards/reports (read-only).

---

### Flow summary (minimal path)

1. **Login** → `POST /auth/login`
2. **Register client** → `POST /patient/register-client` (one body with full form)
3. **ANC visits** → `POST /visit` (per visit)
4. **Delivery** → `POST /delivery` (with newborns in body)
5. **PNC** → `POST /pnc` (per PNC visit)

All other endpoints (GET, PATCH, DELETE) are for reading, updating, or removing those records.

## Available API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login and get access/refresh tokens
- `POST /refresh` - Refresh access token
- `POST /change-password` - Change password (authenticated)
- `POST /first-time-change-password` - Change password for first-time login
- `POST /forgot-password` - Request password reset OTP
- `POST /reset-password` - Reset password with OTP

### Patients (`/api/v1/patient`)
- `GET /` - Get all patients (MIDWIFE, DOCTOR roles)
- `GET /:id` - Get patient by ID
- `POST /` - Create new patient (MIDWIFE, DOCTOR roles)
- `POST /register-client` - **Register client** (full ANC form in one request; matches Register Client UI)
- `PATCH /:id` - Update patient (MIDWIFE, DOCTOR roles)
- `DELETE /:id` - Delete patient (MIDWIFE, DOCTOR roles)

### ANC Records (`/api/v1/anc`)
- `POST /` - Create ANC record
- `GET /:id` - Get ANC record by ID
- `GET /patient/:patientId` - Get all ANC records for a patient
- `PATCH /:id` - Update ANC record
- `DELETE /:id` - Delete ANC record

### Delivery (`/api/v1/delivery`)
- `POST /` - Create delivery record (with newborns); **`patientId` only** — pregnancy is not linked on this API
- `GET /:id` - Get delivery by ID
- `GET /patient/:patientId` - Get all deliveries for a patient
- `PATCH /:id` - Update delivery record
- `DELETE /:id` - Delete delivery record

### PNC Visits (`/api/v1/pnc`)
- `POST /` - Create PNC visit record
- `GET /:id` - Get PNC visit by ID
- `GET /patient/:patientId` - Get all PNC visits for a patient
- `GET /delivery/:deliveryId` - Get all PNC visits for a delivery
- `PATCH /:id` - Update PNC visit
- `DELETE /:id` - Delete PNC visit

### GBV Screening (`/api/v1/gbv-screening`)
- `POST /` - Create GBV screening record
- `GET /:id` - Get GBV screening by ID
- `GET /patient/:patientId` - Get all GBV screenings for a patient
- `GET /gbv-report/:gbvReportId` - Get all GBV screenings for a GBV report
- `PATCH /:id` - Update GBV screening
- `DELETE /:id` - Delete GBV screening

### SRH Registration (`/api/v1/srh`)
- `POST /` - Create SRH registration record
- `GET /:id` - Get SRH registration by ID
- `GET /patient/:patientId` - Get all SRH registrations for a patient
- `PATCH /:id` - Update SRH registration
- `DELETE /:id` - Delete SRH registration

### Visits (`/api/v1/visit`)
- `POST /` - Create visit record (MIDWIFE, DOCTOR roles)
- `GET /:id` - Get visit by ID (MIDWIFE, DOCTOR roles)
- `GET /patient/:patientId` - Get all visits for a patient (MIDWIFE, DOCTOR roles)
- `PATCH /:id` - Update visit (MIDWIFE, DOCTOR roles)
- `DELETE /:id` - Delete visit (MIDWIFE, DOCTOR roles)

### Ultrasound (`/api/v1/ultrasound`)
- `POST /` - Create ultrasound scan with image upload (MIDWIFE, DOCTOR roles)
- `GET /patient/:patientId` - Get all ultrasound scans for a patient (MIDWIFE, DOCTOR roles)
- `GET /:id` - Get ultrasound scan by ID (MIDWIFE, DOCTOR roles)
- `PATCH /:id` - Update ultrasound scan (MIDWIFE, DOCTOR roles)
- `DELETE /:id` - Delete ultrasound scan (MIDWIFE, DOCTOR roles)

### GBV Reports (`/api/v1/gbv`)
- `POST /` - Create GBV report with attachment (MIDWIFE, GBV_OFFICER roles)
- `GET /patient/:patientId` - Get all GBV reports for a patient (MIDWIFE, GBV_OFFICER roles)
- `GET /:id` - Get GBV report by ID (MIDWIFE, GBV_OFFICER roles)
- `PATCH /:id` - Update GBV report (MIDWIFE, GBV_OFFICER roles)
- `DELETE /:id` - Delete GBV report (MIDWIFE, GBV_OFFICER roles)

### Roles (`/api/v1/role`)
- `GET /` - Get all roles
- `POST /assign` - Assign role to user
- `POST /remove` - Remove role from user

### Messages (`/api/v1/messages`)
- `GET /directory` - **Staff picker** (query: optional `search`, `limit`, `offset`). Lists active users with admin or clinical roles (ADMIN, MIDWIFE, DOCTOR, NURSE, GBV_OFFICER, SUPERVISOR); excludes you. Caller must have one of those roles. For choosing `recipientId` when composing.
- `GET /mailbox` - **Email-style list** (query: required `folder=inbox|outbox`, optional `search`, `limit`, `offset`). Inbox = messages you received; outbox = messages you sent. Sorted by `createdAt` descending (flat list, not grouped by user/thread).
- `GET /mailbox/:id` - Single message (full body, sender, recipient) if you are sender or recipient
- `POST /mailbox` - Compose (body: `recipientId`, `body`, optional `attachmentUrl`); server resolves conversation
- `GET /conversations` - List my conversations (legacy thread view; query: `folder=inbox|outbox`, `search`)
- `POST /conversations` - Get or create conversation with another user (body: `otherUserId`)
- `GET /conversations/:id` - Get one conversation
- `GET /conversations/:id/messages` - List messages in conversation (query: `limit`, `offset`)
- `POST /conversations/:id/messages` - Send message (body: `body`, optional `attachmentUrl`)
- `PATCH /conversations/:id/read` - Mark all messages in conversation as read
- `PATCH /messages/:id/read` - Mark a message as read

### Profile (`/api/v1/profile`)
- `GET /me` - Get current user profile (fullName, displayId, profileImageUrl, preferredLanguage, roles)
- `PATCH /me` - Update profile (optional: fullName, profileImageUrl, preferredLanguage)
- `GET /sync-status` - Get last sync status (lastSyncAt, recordsPushed, recordsPulled, status) for Synchronization screen
- `GET /help` - Help and Support (supportEmail, supportPhone, faqUrl; configurable via env: SUPPORT_EMAIL, SUPPORT_PHONE, HELP_FAQ_URL)

### Logout
- `POST /api/v1/auth/logout` - Revoke refresh token (body: `refreshToken`). Use after logout to invalidate the token on the server.

## Register Client – exact form fields (UI ↔ API)

The **Register Client** flow in the ANC Medical Recording UI is supported by a single endpoint that accepts the full form in one request.

**Endpoint:** `POST /api/v1/patient/register-client`  
**Body:** JSON with all fields below. Only `fullName` is required; all others are optional and match the UI screens.

### Screen 1 – Consent
| UI label | API field | Type |
|----------|-----------|------|
| Client consent signature | `clientConsentSignature` | string |
| Health professional consent signature | `healthProfessionalConsentSignature` | string |

### Screen 2 – Basic information (part 1)
| UI label | API field | Type |
|----------|-----------|------|
| Name (Visitor's Name) | `fullName` | string (required) |
| Age | `age` | number |
| Card no | `cardNo` | string |
| Name of Facility | `facility` | string |
| Marital Status | `maritalStatus` | string |
| Sub-city | `subCity` | string |
| Woreda | `woreda` | string |
| Kebele | `kebele` | string |
| House No | `houseNo` | string |
| Phone number / Email | `phone`, `email` | string |
| ID (Number or Photo) | `idNumber` | string |
| Emergency Contact | `emergencyContact` | string |
| Emergency Phone Number | `emergencyPhone` | string |

### Screen 3 – Basic information (part 2)
| UI label | API field | Type |
|----------|-----------|------|
| LMP (Last Menstrual Period) | `lmp` | date (ISO string) |
| EDD (Estimated Due Date) | `edd` | date (ISO string) |
| Gravida | `gravida` | number |
| Para | `para` | number |
| Abortion | `abortion` | number |
| Ectopic Preg. | `ectopicPreg` | number |
| No of Children alive | `childrenAlive` | number |

### Screen 4 – Past obstetric history
| UI label | API field | Type |
|----------|-----------|------|
| List of past births | `pastObstetricHistory` | array of objects (see below) |

Each entry in `pastObstetricHistory`:
| UI label | API field | Type |
|----------|-----------|------|
| Year | `year` | string |
| GA (Gestational Age) | `ga` | string |
| Mode of Delivery | `modeOfDelivery` | string |
| Sex | `sex` | string |
| Birth Weight (kg) | `birthWeightKg` | number or string |

### General medical history
| UI label | API field | Type |
|----------|-----------|------|
| Diabetes Mellitus? (Yes/No) | `diabetesMellitus` | boolean |
| More info (optional) | `diabetesMellitusMoreInfo` | string |
| Cardiac disease? (Yes/No) | `cardiacDisease` | boolean |
| More info (optional) | `cardiacDiseaseMoreInfo` | string |
| Chronic Hypertension? (Yes/No) | `chronicHypertension` | boolean |
| More info (optional) | `chronicHypertensionMoreInfo` | string |
| Medical disease or other? (Yes/No) | `otherMedicalCondition` | boolean |
| More info (optional) | `otherMedicalConditionText` | string |

### Lab tests
| UI label | API field | Type |
|----------|-----------|------|
| VDRL | `vdrl` | string |
| HIV | `hiv` | string |
| HBs Ag | `hbsAg` | string |
| RBS | `rbs` | string |
| FBS | `fbs` | string |
| Blood Group & Rh | `bloodGroupRh` | string |
| UA | `ua` | string |

### Supplement
| UI label | API field | Type |
|----------|-----------|------|
| TO (TD1–TD5) | `td` | string (e.g. "TD1", "TD2", …) |

### Initial evaluation – General exam
| UI label | API field | Type |
|----------|-----------|------|
| General | `generalExamGeneral` | string |
| Pallor | `generalExamPallor` | string |
| Chest abnormality? (Yes/No) | `chestAbnormality` | boolean |
| More info (optional) | `chestAbnormalityMoreInfo` | string |
| Heart abnormality? (Yes/No) | `heartAbnormality` | boolean |
| More info (optional) | `heartAbnormalityMoreInfo` | string |

### Initial evaluation – Gyn exam
| UI label | API field | Type |
|----------|-----------|------|
| Vulvar Ulcer (Yes/No) | `vulvarUlcer` | boolean |
| Vaginal Discharge (Yes/No) | `vaginalDischarge` | boolean |
| Pelvic Mass (Yes/No) | `pelvicMass` | boolean |
| Cervical Lesion (Yes/No) | `cervicalLesion` | boolean |
| Uterine size (Wks) | `uterineSizeWks` | number |

### Counseling / testing
| UI label | API field | Type |
|----------|-----------|------|
| Danger signs in pregnancy & delivery advised (Yes/No) | `dangerSignsAdvised` | boolean |
| Birth preparedness advised (Yes/No) | `birthPreparednessAdvised` | boolean |
| Mother HIV test accepted (Yes/No) | `motherHivTestAccepted` | boolean |
| HIV test result (R/NR/I) | `hivTestResult` | string |

### HIV+ care & follow-up
| UI label | API field | Type |
|----------|-----------|------|
| HIV test result received with post test counseling (Yes/No) | `hivTestResultReceived` | boolean |
| Counseled in infant feeding (Yes/No) | `counseledInfantFeeding` | boolean |
| Referred for care, treatment & support (Yes/No) | `referredForCare` | boolean |
| Partner HIV test result (R/NR/I) | `partnerHivTestResult` | string |

### Present pregnancy – follow-up
| UI label | API field | Type |
|----------|-----------|------|
| GA (LMP) | `gaLmp` | string |
| Complaints | `complaints` | string |
| BP | `bloodPressure` | string |
| Wt. (kg) | `weightKg` | number |
| Pallor | `pallor` | string |
| Hgb | `hemoglobin` | string |
| Uterine Ht (Wks.) | `uterineHeightWks` | number |
| Presentation | `presentation` | string |
| Descent | `descent` | string |
| FHR | `fetalHeartRate` | string |
| Remarks | `remarks` | string |
| Appointment for next follow up | `nextFollowUpDate` | date (ISO string) |
| Danger signs identified & Investigation | `dangerSignsIdentified` | string |
| Action, Advice Counseling | `actionAdviceCounselling` | string |

**Success response (201):** `{ "success": true, "message": "ANC case registered successfully.", "patient": { ... }, "ancRecord": { ... } }`

---

## Delivery Summary Recording – exact form fields (UI ↔ API)

The **Delivery Summary Recording** flow matches the UI screens. Use a single request that creates the delivery and newborns together.

**Endpoint:** `POST /api/v1/delivery`  
**Body:** JSON with `patientId` (required) and any of the fields below. `recordedById` is set from the auth token.

### Screen 1 – Consent
| UI label | API field | Type |
|----------|-----------|------|
| Consent Form Delivery Client – Signature | `clientConsentSignature` | string |
| Consent Form Health Professional – Signature | `healthProfessionalConsentSignature` | string |

### Screen 2 – Core delivery details
| UI label | API field | Type |
|----------|-----------|------|
| Date | `deliveryDate` | date (ISO string) |
| Time | `deliveryTime` | string |
| Referral (Yes/No) | `referral` | boolean |
| Insert Referral Info | `referralInfo` | string |
| AMTSL | `amtsl` | string: "Ergometrine", "Oxytocin", or "Misoprostol" |
| Placenta | `placenta` | string: "Completed", "Incomplete", "CCT", or "NRP" |
| Laceration | `laceration` | string: "1st Degree", "2nd Degree", or "3rd Degree" |

### Screen 3 – Delivery management conditions
| UI label | API field | Type |
|----------|-----------|------|
| Obstetric Cx Managed | `obstetricCxManaged` | boolean |
| APH Managed | `aphManaged` | boolean |
| Ruptured U (Uterus) | `rupturedUx` | boolean |
| Eclampsia Managed | `eclampsiaManaged` | boolean |
| PPH Managed | `pphManaged` | boolean |
| PROM/Sepsis Managed | `promSepsisManaged` | boolean |
| Obs/Prolong labor Managed | `obstPrologLaborManaged` | boolean |

### Screen 4 – Delivery assistance
| UI label | API field | Type |
|----------|-----------|------|
| Delivery assistance measures | `deliveryAssistanceMeasures` | string |
| More | `deliveryAssistanceMore` | string |

### Screens 5 & 6 – Newborn (array `newborns`)
| UI label | API field | Type |
|----------|-----------|------|
| Newborn (Single/Multiple) | `quantity` | string: "Single" or "Multiple" |
| Sex | `sex` | string: "Male" or "Female" |
| Term Status | `termStatus` | string: "Term" or "Preterm" |
| Alive | `alive` | boolean |
| Apgar Score | `apgarScore` | number (0–10) |
| SI (Mac/Fresh) | `sb` | string: "Mac" or "Fresh" |
| Birth wt. (gm) | `birthWeightGm` | number |
| Length (cm) | `lengthCm` | number |
| Vit.K | `vitK` | boolean |
| TTC | `ttc` | boolean |
| Baby mother bonding | `babyMotherBonding` | boolean |

### HIV section
| UI label | API field | Type |
|----------|-----------|------|
| HIV Counselling & Testing Offered | `hivCounsTestingOffered` | string |
| HIV Testing Accepted | `hivTestingAccepted` | string |
| HIV Test Result | `hivTestResult` | string |
| ARV/PX for mothers (by type) | `arvpxForMothers` | string |
| ARV/PX for NB (by type) | `arvpxForNb` | string |
| Feeding Option EBF | `feedingOptionEbf` | string |
| BF / RF | `rf` | string |

**Success response (201):** `{ "success": true, "delivery": { ...patient, pregnancy, newborns... } }` – “Delivery Overview has been registered successfully.”

---

## PNC Medical Recording – exact form fields (UI ↔ API)

The **PNC Medical Recording** flow matches the Register Client screens for postnatal care. One request creates the PNC visit with all sections.

**Endpoint:** `POST /api/v1/pnc`  
**Body:** JSON with `patientId` (required). Optional `deliveryId`. All other fields optional. `recordedById` is set from the auth token.

### Screen 1 – Consent
| UI label | API field | Type |
|----------|-----------|------|
| Consent Form PNC Client – Signature | `clientConsentSignature` | string |
| Consent Form Health Professional – Signature | `healthProfessionalConsentSignature` | string |

### Screen 2 – Postpartum visit (vitals & uterine)
| UI label | API field | Type |
|----------|-----------|------|
| BP | `bloodPressure` | string |
| TPR | `tpr` | string |
| Temperature | `temperature` | number |
| Uterus Contracted/Look for PPH | `uterusContracted` | string |
| Dribbling, Leaking Urine | `dribblingLeakingUrine` | string |

### Screen 3 – Postpartum visit (other)
| UI label | API field | Type |
|----------|-----------|------|
| Anemia | `anemia` | string |
| Vaginal discharge (after 4wks Delivery) | `vaginalDischarge` | string |
| Breast | `breast` | string |
| Vitamin A | `vitaminA` | string |
| Counseling danger signs EPI, Use of ITN given | `counselingDangerSigns` | string |

### Screen 4 – Baby health
| UI label | API field | Type |
|----------|-----------|------|
| Baby Breathing | `babyBreathing` | string |
| Baby Breast Feeding | `babyBreastFeeding` | string |
| Baby Wt.(gm.) | `babyWeightGm` | number |
| Immunization | `immunization` | string |

### HIV section
| UI label | API field | Type |
|----------|-----------|------|
| HIV Tested | `hivTested` | string |
| HIV Test Result (R/NR) | `hivTestResult` | string |
| ARV Px for Mother | `arvPxForMother` | string |
| ARV Px for Newborn | `arvPxForNewborn` | string |
| Feeding Option (EBF/RF) | `feedingOption` | string |

### Referrals & follow-up
| UI label | API field | Type |
|----------|-----------|------|
| Mother Referred to Care & Support | `motherReferredToCare` | string |
| Newborn referred to Chronic HIV infant Care | `newbornReferredToCare` | string |
| Postpartum FP Counseled & Provided | `fpCounseledAndProvided` | string |
| Remark | `remark` | string |
| Action Taken | `actionTaken` | string |

**Success response (201):** `{ "success": true, "visit": { ... } }` – "PNC Case have been registered successfully."

---

## GBV Screening and Registration – exact form fields (UI ↔ API)

**Register Survivor** flow: create a **patient** first (basic info), then optionally a **GBV report** (with referral), then **GBV screening** with the full form.

- **Basic info (Screen 3):** Use `POST /api/v1/patient` – fullName (Name), age (Age), address (Location), phone, email, idNumber (ID), emergencyContact, emergencyPhone.
- **Referral:** Use `POST /api/v1/gbv` with `patientId`, `referral` (boolean), `referralInfo` (optional), plus any attachment – then use returned report id as `gbvReportId` when creating screening.
- **Screening (all other screens):** `POST /api/v1/gbv-screening` with `patientId` (and optional `gbvReportId`) plus the fields below.

### Screen 1 – Consent
| UI label | API field | Type |
|----------|-----------|------|
| Consent Form GBV Survivor – Signature | `survivorConsentSignature` | string |
| Consent Form Case Worker – Signature | `caseWorkerConsentSignature` | string |

### Basic Information (Screen 3) – patient + referral
| UI label | API field | Type / Note |
|----------|-----------|--------------|
| Name | Patient `fullName` | Create via POST /patient |
| Age | Patient `age` | |
| Location | Patient `address` | |
| Phone number/ Email | Patient `phone`, `email` | |
| ID (Number or Photo) | Patient `idNumber` | |
| Emergency Contact | Patient `emergencyContact` | |
| Emergency Phone Number | Patient `emergencyPhone` | |
| Referral (Yes/No) | Report `referral` | POST /gbv (or in report) |
| Insert Referral Info | Report `referralInfo` | |

### Comprehensive GBV history
| UI label | API field | Type |
|----------|-----------|------|
| History | `gbvHistory` | string |

### Vital Signs
| UI label | API field | Type |
|----------|-----------|------|
| Temperature (°c/°f) | `temperature` | string |
| Weight (kg) | `weightKg` | number |
| Height (cm) | `heightCm` | number |
| BMI Index | `bmiIndex` | number (auto-calculating) |
| Blood Pressure (mmHg) | `bloodPressure` | string |
| Pulse (b/min) | `pulse` | string |
| Respiratory Rate | `respiratoryRate` | string |
| Oxygen Saturation | `oxygenSaturation` | string |

### Physical Examination
| UI label | API field | Type |
|----------|-----------|------|
| Physical Examination | `physicalExamination` | string |

### Working Diagnosis
| UI label | API field | Type |
|----------|-----------|------|
| GBV Screening and Diagnose | `workingDiagnosis` | string |

### Laboratory
| UI label | API field | Type |
|----------|-----------|------|
| Lab results | `laboratoryResults` | string |

### Test Results
| UI label | API field | Type |
|----------|-----------|------|
| Pregnancy Testing | `pregnancyTestingResults` | string |
| HIV Testing | `hivTestingResults` | string |
| STI Testing | `stiTestingResults` | string |
| Post-Exposure Prophylaxis Treatment | `postExposureProphylaxisTreatment` | string |
| Emergency Contraceptive Provision for FP | `emergencyContraceptiveProvision` | string |

### Ultrasound Request
| UI label | API field | Type |
|----------|-----------|------|
| Type of ultrasound | `typeOfUltrasound` | string |
| More (optional) | `ultrasoundMore` | string |
| Smart Ultrasound Recommendation | `smartUltrasoundRecommendation` | string |

### Treatment plan
| UI label | API field | Type |
|----------|-----------|------|
| Treatment plan | `treatmentPlan` | string |
| Treatment (Rx) | `treatmentRx` | string |
| Continuation Sheet | `continuationSheet` | string |

**Success response (201):** `{ "success": true, "screening": { ... } }` – "GBV Case have been registered successfully."

---

## SRH Medical Registration – exact form fields (UI ↔ API)

The **SRH Medical Registration** flow matches the Register Client screens. Create a **patient** first (basic info), then **POST /api/v1/srh** with the full form.

**Endpoint:** `POST /api/v1/srh`  
**Body:** JSON with `patientId` (required). All other fields optional. `recordedById` is set from the auth token.

### Screen 1 – Consent
| UI label | API field | Type |
|----------|-----------|------|
| Consent Form SRH Client – Signature | `clientConsentSignature` | string |
| Consent Form Health Professional – Signature | `healthProfessionalConsentSignature` | string |

### Screen 2 – Basic Information
| UI label | API field | Type / Note |
|----------|-----------|-------------|
| Name | Patient `fullName` | Create via POST /patient |
| Age | Patient `age` | |
| Location | Patient `address` | |
| Phone number/Email | Patient `phone`, `email` | |
| ID (Number or Photo) | Patient `idNumber` | |
| Emergency Contact | Patient `emergencyContact` | |
| Emergency Phone Number | Patient `emergencyPhone` | |

### Screen 3 – History
| UI label | API field | Type |
|----------|-----------|------|
| SRH Service Type (Select SRH Service) | `srhServiceType` | string (e.g. Family Planning, Routine Care, STI/HIV, Others) |
| History | `history` | string |

### Screen 4 – Vital Signs
| UI label | API field | Type |
|----------|-----------|------|
| Temperature (°C) | `temperature` | string |
| Weight (kg) | `weightKg` | number |
| Height (cm) | `heightCm` | number |
| BMI Index | `bmiIndex` | number (auto-calculating) |
| Blood Pressure (mmHg) | `bloodPressure` | string |
| Pulse (b/min) | `pulse` | string |
| Respiratory Rate | `respiratoryRate` | string |
| Oxygen Saturation | `oxygenSaturation` | string |

### Physical Examination
| UI label | API field | Type |
|----------|-----------|------|
| Physical Examination | `physicalExamination` | string |

### Working Diagnosis
| UI label | API field | Type |
|----------|-----------|------|
| Working Diagnosis / Insert Diagnosis | `workingDiagnosis` | string |

### Laboratory
| UI label | API field | Type |
|----------|-----------|------|
| Laboratory / Lab results | `laboratoryResults` | string |

### Request (Ultrasound)
| UI label | API field | Type |
|----------|-----------|------|
| Type of ultrasound | `typeOfUltrasound` | string |
| More (optional) | `ultrasoundMore` | string |
| Smart Ultrasound Recommendation | `smartUltrasoundRecommendation` | string |

### Treatment plan
| UI label | API field | Type |
|----------|-----------|------|
| Treatment plan | `treatmentPlan` | string |
| Treatment (Rx) | `treatmentRx` | string |
| Continuation Sheet | `continuationSheet` | string |

**Success response (201):** `{ "success": true, "registration": { ... } }` – "SRH Case have been registered successfully."

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## Features

- **Auto-calculated BMI**: BMI is automatically calculated from weight and height in ANC, GBV Screening, and SRH records
- **File Uploads**: Ultrasound and GBV reports support file/image uploads
- **Nested Resources**: Delivery records can include newborn records in a single request
- **Comprehensive Validation**: All inputs are validated using Zod schemas

## Getting Started

1. Start the server: `npm run dev`
2. Access Swagger UI: http://localhost:3000/api-docs
3. Use the "Authorize" button in Swagger UI to add your JWT token
4. Explore and test all endpoints interactively

