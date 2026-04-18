import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { sendData, sendError, parsePagination, meta } from "./helpers";
import {
  syncAllConfiguredEntitiesToMongo,
  syncEntityFromPrismaToMongo,
} from "../mongo/mirror.service";
import {
  entityModels,
  listPrismaSyncEntities,
  PrismaSyncEntity,
} from "../mongo/entity-models";
import {
  buildMongoListFilter,
  mongoListSort,
} from "../mongo/mongo-list-filters";
import { connectMongoIfConfigured, isMongoConfigured } from "../config/mongo";

const router = Router();
const allowedEntities = new Set(listPrismaSyncEntities());

async function ensureMongo(res: Response) {
  if (!isMongoConfigured()) {
    sendError(
      res,
      "MONGO_NOT_CONFIGURED",
      "Set MONGODB_URI (or MONGO_URI) to use Mongo sync APIs",
      400,
    );
    return false;
  }
  await connectMongoIfConfigured();
  return true;
}

/**
 * @swagger
 * /api/v1/mongo/entities:
 *   get:
 *     summary: List Prisma entity names that have a Mongo mirror
 *     description: Returns the same names accepted as `entityType` on other `/mongo` routes (PascalCase).
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ data: PrismaSyncEntityName[] }"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MongoEntitiesResponse'
 * /api/v1/mongo/sync:
 *   post:
 *     summary: Upsert all mirrored entities from Prisma into MongoDB
 *     description: Runs a full sync for every entity type (same as calling per-entity sync for each).
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Per-entity upsert/delete counts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MongoSyncAllResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/sync/{entityType}:
 *   post:
 *     summary: Upsert one entity type from Prisma into MongoDB
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/PrismaSyncEntityName'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MongoSyncSingleResponse'
 *       400:
 *         description: Unknown entityType or Mongo not configured
 * /api/v1/mongo/Patient:
 *   get:
 *     summary: List Patient documents (Mongo mirror, filtered)
 *     description: |
 *       Filters: any query key other than `page`, `limit`, `sort`, `order` is an equality filter on the document.
 *       Date ranges: `field_gte` / `field_lte` with ISO-8601 values (e.g. `createdAt_gte`, `updatedAt_lte`).
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         description: "{ data: object[], meta }"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Visit:
 *   get:
 *     summary: List Visit documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Ultrasound:
 *   get:
 *     summary: List Ultrasound documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/GBVReport:
 *   get:
 *     summary: List GBVReport documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/GBVScreening:
 *   get:
 *     summary: List GBVScreening documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/SRHRegistration:
 *   get:
 *     summary: List SRHRegistration documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/ANCRecord:
 *   get:
 *     summary: List ANCRecord documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Delivery:
 *   get:
 *     summary: List Delivery documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/PNCVisit:
 *   get:
 *     summary: List PNCVisit documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Pregnancy:
 *   get:
 *     summary: List Pregnancy documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Referral:
 *   get:
 *     summary: List Referral documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Message:
 *   get:
 *     summary: List Message documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Conversation:
 *   get:
 *     summary: List Conversation documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/User:
 *   get:
 *     summary: List User documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Role:
 *   get:
 *     summary: List Role documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/UserRole:
 *   get:
 *     summary: List UserRole documents (Mongo mirror, filtered)
 *     description: Same filter rules as `GET /mongo/Patient`.
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoListPage'
 *       - $ref: '#/components/parameters/MongoListLimit'
 *       - $ref: '#/components/parameters/MongoListSort'
 *       - $ref: '#/components/parameters/MongoListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpListResponse'
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Patient/{id}:
 *   get:
 *     summary: Get one Patient by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Visit/{id}:
 *   get:
 *     summary: Get one Visit by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Ultrasound/{id}:
 *   get:
 *     summary: Get one Ultrasound by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/GBVReport/{id}:
 *   get:
 *     summary: Get one GBVReport by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/GBVScreening/{id}:
 *   get:
 *     summary: Get one GBVScreening by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/SRHRegistration/{id}:
 *   get:
 *     summary: Get one SRHRegistration by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/ANCRecord/{id}:
 *   get:
 *     summary: Get one ANCRecord by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Delivery/{id}:
 *   get:
 *     summary: Get one Delivery by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/PNCVisit/{id}:
 *   get:
 *     summary: Get one PNCVisit by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Pregnancy/{id}:
 *   get:
 *     summary: Get one Pregnancy by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Referral/{id}:
 *   get:
 *     summary: Get one Referral by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Message/{id}:
 *   get:
 *     summary: Get one Message by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Conversation/{id}:
 *   get:
 *     summary: Get one Conversation by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/User/{id}:
 *   get:
 *     summary: Get one User by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/Role/{id}:
 *   get:
 *     summary: Get one Role by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 * /api/v1/mongo/UserRole/{id}:
 *   get:
 *     summary: Get one UserRole by id (Mongo mirror)
 *     tags: [Mongo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DmpDataResponse'
 *       404:
 *         description: Not found
 *       400:
 *         description: Mongo not configured
 */
router.get(
  "/entities",
  authenticate,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      sendData(res, listPrismaSyncEntities());
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/sync",
  authenticate,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const results = await syncAllConfiguredEntitiesToMongo();
      sendData(res, { syncedAt: new Date().toISOString(), results });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/sync/:entityType",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const entityType = req.params.entityType as PrismaSyncEntity;
      if (!allowedEntities.has(entityType)) {
        return sendError(res, "BAD_REQUEST", "Unknown entityType", 400);
      }
      const result = await syncEntityFromPrismaToMongo(entityType);
      sendData(res, { syncedAt: new Date().toISOString(), ...result });
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/Patient",
  // authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.Patient.countDocuments(filter);
      const rows = await entityModels.Patient.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/Patient/:id",
  // authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.Patient.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "Patient not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/Visit",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.Visit.countDocuments(filter);
      const rows = await entityModels.Visit.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/Visit/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.Visit.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "Visit not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/Ultrasound",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.Ultrasound.countDocuments(filter);
      const rows = await entityModels.Ultrasound.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/Ultrasound/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.Ultrasound.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "Ultrasound not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/GBVReport",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.GBVReport.countDocuments(filter);
      const rows = await entityModels.GBVReport.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/GBVReport/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.GBVReport.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "GBV report not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/GBVScreening",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.GBVScreening.countDocuments(filter);
      const rows = await entityModels.GBVScreening.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/GBVScreening/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.GBVScreening.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "GBV screening not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/SRHRegistration",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.SRHRegistration.countDocuments(filter);
      const rows = await entityModels.SRHRegistration.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/SRHRegistration/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.SRHRegistration.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "SRH registration not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/ANCRecord",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.ANCRecord.countDocuments(filter);
      const rows = await entityModels.ANCRecord.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/ANCRecord/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.ANCRecord.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "ANC record not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/Delivery",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.Delivery.countDocuments(filter);
      const rows = await entityModels.Delivery.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/Delivery/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.Delivery.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "Delivery not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/PNCVisit",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.PNCVisit.countDocuments(filter);
      const rows = await entityModels.PNCVisit.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/PNCVisit/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.PNCVisit.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "PNC visit not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/Pregnancy",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.Pregnancy.countDocuments(filter);
      const rows = await entityModels.Pregnancy.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/Pregnancy/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.Pregnancy.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "Pregnancy not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/Referral",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.Referral.countDocuments(filter);
      const rows = await entityModels.Referral.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/Referral/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.Referral.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "Referral not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/Message",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.Message.countDocuments(filter);
      const rows = await entityModels.Message.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/Message/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.Message.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "Message not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/Conversation",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.Conversation.countDocuments(filter);
      const rows = await entityModels.Conversation.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/Conversation/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.Conversation.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "Conversation not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/User",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.User.countDocuments(filter);
      const rows = await entityModels.User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/User/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.User.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "User not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/Role",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.Role.countDocuments(filter);
      const rows = await entityModels.Role.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/Role/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.Role.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "Role not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/UserRole",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const filter = buildMongoListFilter(req);
      const sort = mongoListSort(req);
      const total = await entityModels.UserRole.countDocuments(filter);
      const rows = await entityModels.UserRole.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(res, rows, 200, meta(page, limit, total));
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/UserRole/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const id = req.params.id;
      if (typeof id !== "string" || id.length === 0) {
        return sendError(res, "BAD_REQUEST", "Missing id", 400);
      }
      const row = await entityModels.UserRole.findOne({ id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "User role not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
