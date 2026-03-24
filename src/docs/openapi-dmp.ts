/**
 * @swagger
 * tags:
 *   - name: DMP
 *     description: UNFPA Digital Maternity Package — API-REFERENCE.md contract (JSON `{ data, meta? }`)
 *   - name: Admin
 *     description: Administrative endpoints (seeding, maintenance)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiDataWrapper:
 *       type: object
 *       properties:
 *         data: {}
 *         meta:
 *           type: object
 *           properties:
 *             page: { type: integer }
 *             limit: { type: integer }
 *             total: { type: integer }
 *             totalPages: { type: integer }
 *     LoginRequest:
 *       type: object
 *       required: [password]
 *       properties:
 *         email: { type: string, format: email }
 *         phone: { type: string }
 *         password: { type: string }
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         accessToken: { type: string }
 *         refreshToken: { type: string }
 *         expiresIn: { type: integer }
 *         user: { type: object }
 *         data:
 *           type: object
 *           properties:
 *             accessToken: { type: string }
 *             refreshToken: { type: string }
 *             expiresIn: { type: integer }
 *             user: { type: object }
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login (phone or email + password)
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Tokens and user (API-REFERENCE + legacy fields)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 */

/**
 * @swagger
 * /api/v1/patients:
 *   get:
 *     summary: List patients (DMP)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated patient list
 *   post:
 *     summary: Register patient (DMP)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/patient/register-client:
 *   post:
 *     summary: Register client — full ANC form (legacy UI)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/visits:
 *   get:
 *     summary: List prenatal visits (DMP)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create visit (DMP)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/ultrasounds:
 *   get:
 *     summary: List ultrasounds (DMP)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List users (admin)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/clinics:
 *   get:
 *     summary: List clinics (DMP)
 *     tags: [DMP]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/analytics/overview:
 *   get:
 *     summary: Combined analytics (DMP)
 *     tags: [DMP, Analytics]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/analytics/dashboard-stats:
 *   get:
 *     summary: Dashboard stat cards (DMP)
 *     tags: [DMP, Analytics]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     summary: Dashboard statistics (legacy shape)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/admin/seed:
 *   post:
 *     summary: Seed database
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Seed-Secret
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scope:
 *                 type: string
 *                 enum: [roles, demo, all]
 *     responses:
 *       200:
 *         description: Seed result
 */

export {};
