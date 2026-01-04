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
- `PATCH /:id` - Update patient (MIDWIFE, DOCTOR roles)
- `DELETE /:id` - Delete patient (MIDWIFE, DOCTOR roles)

### ANC Records (`/api/v1/anc`)
- `POST /` - Create ANC record
- `GET /:id` - Get ANC record by ID
- `GET /patient/:patientId` - Get all ANC records for a patient
- `PATCH /:id` - Update ANC record
- `DELETE /:id` - Delete ANC record

### Delivery (`/api/v1/delivery`)
- `POST /` - Create delivery record (with newborns)
- `GET /:id` - Get delivery by ID
- `GET /patient/:patientId` - Get all deliveries for a patient
- `GET /pregnancy/:pregnancyId` - Get all deliveries for a pregnancy
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

