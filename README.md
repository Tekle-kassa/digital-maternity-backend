# Digital Maternity Backend

REST API backend for the **UNFPA Digital Maternity Package (DMP)** — a platform for managing antenatal care (ANC), delivery, postnatal care (PNC), ultrasounds, GBV reporting, SRH registration, teleconsultation, analytics, and facility-to-central sync.

Built with **Node.js**, **Express 5**, **TypeScript**, **Prisma**, and **PostgreSQL**, with optional **MongoDB** mirroring for cloud deployments and **S3-compatible storage** for file uploads.

---

## Features

| Module | Description |
|--------|-------------|
| **Authentication** | JWT access/refresh tokens, password reset via OTP, role-based access |
| **Patients & ANC** | Client registration (single-form `register-client`), ANC records, prenatal visits |
| **Delivery & PNC** | Delivery records with newborns, postnatal visit tracking |
| **Ultrasound** | Image upload to S3/MinIO, review workflow, metadata capture |
| **GBV** | GBV reports and screening (encrypted sensitive fields) |
| **SRH** | Sexual and reproductive health registration |
| **Referrals** | Patient referral management |
| **Messaging** | In-app messaging between staff |
| **Analytics** | Dashboard stats, charts, and reporting endpoints |
| **DMP API (`/api/v1/*`)** | Clinics, appointments, alerts, teleconsults, risk scoring, activity feed |
| **Sync** | Facility ↔ central API sync (ingest, queue, conflict resolution) |
| **Mongo mirror** | Optional MongoDB read/write mirror for cloud mode |
| **Admin seeding** | Bootstrap roles and demo data via protected seed endpoint |

---

## Tech stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **ORM:** Prisma 6 (PostgreSQL)
- **Validation:** Zod
- **Auth:** JWT + bcrypt
- **File storage:** AWS S3 / MinIO via `@aws-sdk/client-s3` and `multer-s3`
- **Optional DB:** MongoDB (Mongoose) for sync mirror
- **API docs:** Swagger UI (`swagger-jsdoc`, `swagger-ui-express`)

---

## Prerequisites

- Node.js 18+ (recommended: 20+)
- PostgreSQL 14+
- (Optional) MongoDB — required for cloud sync mirror features
- (Optional) S3-compatible object storage — required for ultrasound/file uploads

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/digital-maternity-backend.git
cd digital-maternity-backend
npm install
```

`postinstall` runs `prisma generate` automatically.

### 2. Configure environment

Create a `.env` file in the project root:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/digital_maternity

# JWT (required in production — change defaults)
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=30
BCRYPT_SALT_ROUNDS=12

# GBV field encryption (required if using GBV modules)
GBV_ENCRYPTION_KEY=base64-encoded-32-byte-key

# S3 / MinIO (optional — needed for file uploads)
AWS_REGION=us-east-1
AWS_S3_BUCKET=digital-maternity-ultrasound
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_PUBLIC_BASE_URL=http://localhost:9000/digital-maternity-ultrasound
S3_FORCE_PATH_STYLE=1

# MongoDB mirror (optional — cloud mode)
IS_CLOUD=
MONGODB_URI=
MONGO_DB_NAME=

# Facility sync (local deployments pushing to central)
CENTRAL_SYNC_URL=https://api.dmp.sofoniasayele.com
CENTRAL_SYNC_SECRET=
FACILITY_ID=
FACILITY_CLINIC_ID=

# Admin seeding
SEED_SECRET=
SEED_ADMIN_EMAIL=admin@demo.local
SEED_ADMIN_PASSWORD=ChangeMe123!
```

### 3. Set up the database

```bash
# Apply all migrations
npx prisma migrate deploy

# Seed default roles (ADMIN, MIDWIFE, DOCTOR, GBV_OFFICER, NURSE)
npm run seed
```

### 4. Run the server

**Development** (with hot reload via nodemon):

```bash
npm run dev
```

**Production:**

```bash
npm run build
npm start
```

The server starts on `http://localhost:3000` (or the port set in `PORT`).

---

## API documentation

| Resource | Location |
|----------|----------|
| **Interactive Swagger UI** | `http://localhost:3000/api-docs` (when server is running) |
| **API flow & legacy modules** | [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) |
| **DMP endpoint reference** | [`API-REFERENCE.md`](./API-REFERENCE.md) |
| **Database schema (SQL)** | [`database-schema.sql`](./database-schema.sql) |

All endpoints are prefixed with **`/api/v1`**.

### Authentication

Most endpoints require a Bearer token:

```http
Authorization: Bearer <access_token>
```

Obtain a token via `POST /api/v1/auth/login`, then use it on subsequent requests. Refresh with `POST /api/v1/auth/refresh`.

### Typical maternity workflow

1. **Login** → `POST /api/v1/auth/login`
2. **Register client** → `POST /api/v1/patient/register-client`
3. **ANC visits** → `POST /api/v1/visit`
4. **Delivery** → `POST /api/v1/delivery` (include newborns in body)
5. **PNC** → `POST /api/v1/pnc`

See [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) for the full step-by-step flow.

---

## Project structure

```
digital-maternity-backend/
├── prisma/
│   ├── schema.prisma          # Database models
│   ├── migrations/            # Prisma migration history
│   └── seed.ts                # Role seed script
├── src/
│   ├── server.ts              # App entry point
│   ├── config/                # Prisma, Mongo, S3, Swagger, env config
│   ├── middleware/            # Auth, error handling
│   ├── auth/                  # Login, register, OTP, tokens
│   ├── patient/               # Patient CRUD + register-client
│   ├── anc/                   # ANC records
│   ├── visit/                 # Prenatal visits
│   ├── delivery/              # Delivery + newborns
│   ├── pnc/                   # Postnatal visits
│   ├── ultrsound/             # Ultrasound upload & review
│   ├── gbv/                   # GBV reports
│   ├── gbv-screening/         # GBV screening
│   ├── srh/                   # SRH registration
│   ├── referral/              # Referrals
│   ├── messages/              # Staff messaging
│   ├── analytics/             # Reports & dashboards
│   ├── profile/               # User profile & settings
│   ├── v1/                    # DMP API routers (clinics, sync, risk, etc.)
│   ├── mongo/                 # MongoDB mirror service
│   └── seed/                  # Admin seed endpoint
├── API_DOCUMENTATION.md
├── API-REFERENCE.md
└── database-schema.sql
```

---

## Roles

Default roles seeded into the database:

| Role | Description |
|------|-------------|
| `ADMIN` | System administrator |
| `MIDWIFE` | Handles ANC visits and client registration |
| `DOCTOR` | Clinical oversight and teleconsult |
| `GBV_OFFICER` | GBV case management |
| `NURSE` | General care assistance |

Assign roles via `POST /api/v1/role/assign` after user registration.

---

## Admin seeding

Bootstrap roles and demo data without manual SQL:

```http
POST /api/v1/admin/seed
Content-Type: application/json
X-Seed-Secret: <SEED_SECRET>   # if SEED_SECRET is configured

{ "scope": "roles" | "demo" | "all" }
```

Alternatively, an authenticated **ADMIN** JWT can call this endpoint when `SEED_SECRET` is not set.

---

## Sync & deployment modes

### Local facility

A clinic deployment stores data in PostgreSQL and can push changes to a central cloud API:

- Set `CENTRAL_SYNC_URL` to the central API origin (no trailing slash).
- Set `FACILITY_ID` and optionally `FACILITY_CLINIC_ID` to identify this facility.
- Optionally set `CENTRAL_SYNC_SECRET` for authenticated ingest.

### Cloud mode

When `IS_CLOUD=true` and `MONGODB_URI` is set:

- MongoDB mirror APIs under `/api/v1/mongo/*` become available.
- Sync pull/summary endpoints can read from the mirror.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production server |
| `npm run seed` | Seed default roles into PostgreSQL |
| `npx prisma migrate dev` | Create/apply migrations in development |
| `npx prisma migrate deploy` | Apply migrations in production |
| `npx prisma studio` | Open Prisma database GUI |

---

## Environment variables reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes (prod) | Access token signing secret |
| `JWT_REFRESH_SECRET` | Yes (prod) | Refresh token signing secret |
| `GBV_ENCRYPTION_KEY` | For GBV | Base64-encoded 32-byte AES key |
| `PORT` | No | Server port (default: `3000` in server, `4000` in config helper) |
| `AWS_S3_*` / `S3_*` | For uploads | S3/MinIO credentials and bucket |
| `MONGODB_URI` | For cloud mirror | MongoDB connection string |
| `IS_CLOUD` | For cloud mirror | Enable cloud/sync mirror mode |
| `CENTRAL_SYNC_URL` | For local sync | Central API origin |
| `FACILITY_ID` | For local sync | This facility's identifier |
| `SEED_SECRET` | For seed API | Protects `POST /admin/seed` |

See [`src/config/index.ts`](./src/config/index.ts) and [`src/config/s3.ts`](./src/config/s3.ts) for full configuration details.

---

## License

ISC
