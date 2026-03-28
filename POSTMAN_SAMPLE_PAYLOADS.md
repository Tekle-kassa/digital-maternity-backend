# Postman sample payloads (after auth)

**Base URL:** `{{baseURL}}` (e.g. `http://localhost:3000/api/v1`)  
**Auth:** For all requests below (except auth), add header:  
`Authorization: Bearer <accessToken>`

Get `accessToken` from `POST {{baseURL}}/auth/login` with body:  
`{ "phone": "+251911234567", "password": "yourpassword" }`

---

## 1. Auth (no Bearer)

### POST `/auth/change-password` (authenticated)
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### POST `/auth/logout`
```json
{
  "refreshToken": "<paste refreshToken from login response>"
}
```

### POST `/auth/refresh`
```json
{
  "refreshToken": "<paste refreshToken from login response>"
}
```

---

## 2. Role

### POST `/role/assign`
```json
{
  "userId": "<user-uuid>",
  "roleId": "<role-uuid>"
}
```
Get role IDs from `GET /role`.

---

## 3. Patient

### POST `/patient` – create patient only
```json
{
  "fullName": "Abebe Kebede",
  "age": 28,
  "phone": "+251911000001",
  "cardNo": "CARD001",
  "address": "Addis Ababa",
  "subCity": "Bole",
  "woreda": "03",
  "kebele": "05",
  "maritalStatus": "Married",
  "emergencyContact": "Kebede",
  "emergencyPhone": "+251922000001"
}
```

### POST `/patient/register-client` – full Register Client (patient + ANC in one)
```json
{
  "fullName": "Hawot Gebre",
  "age": 26,
  "cardNo": "10000100",
  "phone": "+251911000002",
  "address": "Addis Ababa, Bole",
  "clientConsentSignature": "Client signed",
  "healthProfessionalConsentSignature": "HP signed",
  "lmp": "2024-06-01",
  "edd": "2025-03-08",
  "gravida": 2,
  "para": 1,
  "bloodGroupRh": "O+",
  "vdrl": "Non-reactive",
  "hiv": "Negative",
  "bloodPressure": "120/80",
  "weightKg": 62.5
}
```

### PATCH `/patient/:id`
```json
{
  "fullName": "Abebe Kebede Updated",
  "phone": "+251911000003",
  "age": 29
}
```

---

## 4. ANC

### POST `/anc` – create ANC record (use when patient already exists)
```json
{
  "patientId": "<patient-uuid>",
  "clientConsentSignature": "Client signed",
  "healthProfessionalConsentSignature": "HP signed",
  "lmp": "2024-06-01",
  "edd": "2025-03-08",
  "gravida": 2,
  "para": 1,
  "bloodGroupRh": "O+",
  "vdrl": "Non-reactive",
  "hiv": "Negative",
  "bloodPressure": "120/80",
  "weightKg": 62.5
}
```

### PATCH `/anc/:id`
```json
{
  "bloodPressure": "118/78",
  "weightKg": 63,
  "hemoglobin": "12.5",
  "nextFollowUpDate": "2025-04-01"
}
```

---

## 5. Visit

### POST `/visit`
```json
{
  "patientId": "<patient-uuid>",
  "pregnancyId": "<pregnancy-uuid>",
  "visitNumber": 1,
  "visitType": "ANC",
  "gestationalAge": 12,
  "bloodPressure": "120/80",
  "temperature": 36.8,
  "weight": 62,
  "symptoms": "Mild nausea",
  "notes": "Routine check"
}
```

### PATCH `/visit/:id`
```json
{
  "bloodPressure": "118/76",
  "weight": 62.5,
  "notes": "Follow-up in 4 weeks"
}
```

---

## 6. Delivery

### POST `/delivery`
```json
{
  "patientId": "<patient-uuid>",
  "pregnancyId": "<pregnancy-uuid>",
  "clientConsentSignature": "Client signed",
  "healthProfessionalConsentSignature": "HP signed",
  "deliveryDate": "2025-03-10",
  "deliveryTime": "14:30",
  "referral": false,
  "amtsl": "Oxytocin",
  "placenta": "Completed",
  "laceration": "1st Degree",
  "newborns": [
    {
      "quantity": "Single",
      "sex": "Female",
      "termStatus": "Term",
      "alive": true,
      "apgarScore": 9,
      "birthWeightGm": 3200,
      "vitK": true,
      "ttc": true,
      "babyMotherBonding": true
    }
  ]
}
```

### PATCH `/delivery/:id`
```json
{
  "deliveryTime": "14:45",
  "deliveryAssistanceMore": "Episiotomy performed"
}
```

---

## 7. PNC

### POST `/pnc`
```json
{
  "patientId": "<patient-uuid>",
  "deliveryId": "<delivery-uuid>",
  "clientConsentSignature": "Client signed",
  "healthProfessionalConsentSignature": "HP signed",
  "visitDate": "2025-03-17",
  "bloodPressure": "110/70",
  "temperature": 36.5,
  "uterusContracted": "Yes",
  "vaginalDischarge": "Normal",
  "breast": "No issues",
  "babyBreathing": "Normal",
  "babyBreastFeeding": "Yes",
  "babyWeightGm": 3100,
  "remark": "Mother and baby well"
}
```

### PATCH `/pnc/:id`
```json
{
  "bloodPressure": "112/72",
  "remark": "Follow-up in 2 weeks"
}
```

---

## 8. GBV Screening

### POST `/gbv-screening`
```json
{
  "patientId": "<patient-uuid>",
  "gbvReportId": "<gbv-report-uuid>",
  "survivorConsentSignature": "Survivor signed",
  "caseWorkerConsentSignature": "Case worker signed",
  "gbvHistory": "Disclosed incident details",
  "bloodPressure": "120/80",
  "weightKg": 58,
  "physicalExamination": "Documented",
  "workingDiagnosis": "GBV survivor - follow-up",
  "pregnancyTestingResults": "Negative",
  "hivTestingResults": "Pending"
}
```

### PATCH `/gbv-screening/:id`
```json
{
  "hivTestingResults": "Negative",
  "treatmentPlan": "Counseling and follow-up"
}
```

---

## 9. SRH

### POST `/srh`
```json
{
  "patientId": "<patient-uuid>",
  "clientConsentSignature": "Client signed",
  "healthProfessionalConsentSignature": "HP signed",
  "srhServiceType": "Family Planning",
  "history": "Requesting contraception",
  "temperature": "36.6",
  "weightKg": 55,
  "heightCm": 162,
  "bloodPressure": "118/76",
  "physicalExamination": "Normal",
  "workingDiagnosis": "Request for FP",
  "treatmentPlan": "Provide method of choice"
}
```

### PATCH `/srh/:id`
```json
{
  "treatmentPlan": "COC prescribed",
  "treatmentRx": "COC 21 days"
}
```

---

## 10. Ultrasound

**POST `/ultrasound`** uses **form-data** (not raw JSON):

| Key        | Type | Value                          |
|-----------|------|---------------------------------|
| patientId | text | `<patient-uuid>`               |
| visitId   | text | `<visit-uuid>` (optional)      |
| image     | file | Select an image file           |
| description | text | Optional description         |
| gestationalAge | number | e.g. 12 (optional)     |

### PATCH `/ultrasound/:id` (JSON body)
```json
{
  "description": "Follow-up scan",
  "gestationalAge": 20,
  "annotations": "Placenta anterior"
}
```

---

## 11. Messages

### POST `/messages/conversations` – get or create conversation
```json
{
  "otherUserId": "<other-user-uuid>"
}
```

### POST `/messages/conversations/:id/messages` – send message
```json
{
  "body": "Hello, follow-up appointment confirmed for next week.",
  "attachmentUrl": ""
}
```

### PATCH `/messages/conversations/:id/read` – mark conversation read  
No body.

### PATCH `/messages/messages/:id/read` – mark message read  
No body.

---

## 12. Profile

### PATCH `/profile/me`
```json
{
  "fullName": "Hawot Gebre",
  "displayId": "10000100",
  "profileImageUrl": "https://example.com/avatar.jpg",
  "preferredLanguage": "EN"
}
```
Allowed `preferredLanguage`: `"EN"` or `"SO"`.

---

## GET endpoints (no body – use with Bearer)

- `GET /patient` – list patients  
- `GET /patient/:id` – get patient  
- `GET /anc/patient/:patientId` – ANC records for patient  
- `GET /anc/:id` – one ANC record  
- `GET /visit/patient/:patientId` – visits for patient  
- `GET /visit/:id` – one visit  
- `GET /delivery/patient/:patientId` – deliveries for patient  
- `GET /delivery/:id` – one delivery  
- `GET /pnc/patient/:patientId` – PNC visits for patient  
- `GET /pnc/:id` – one PNC visit  
- `GET /gbv-screening/patient/:patientId` – screenings for patient  
- `GET /gbv-screening/:id` – one screening  
- `GET /srh/patient/:patientId` – SRH registrations for patient  
- `GET /srh/:id` – one SRH registration  
- `GET /ultrasound/patient/:patientId` – ultrasounds for patient  
- `GET /ultrasound/:id` – one ultrasound  
- `GET /role` – list roles (for assign: get `roleId`)  
- `GET /messages/conversations?folder=inbox` – my conversations  
- `GET /messages/conversations/:id/messages?limit=20&offset=0` – messages in conversation  
- `GET /profile/me` – my profile  
- `GET /profile/sync-status` – last sync status  
- `GET /profile/help` – help/support info  

Replace `<patient-uuid>`, `<delivery-uuid>`, etc. with IDs returned from earlier POSTs (e.g. create patient → use `patient.id` in visit/delivery/ANC).
