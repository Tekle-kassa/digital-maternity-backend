import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authMiddleware";
import { sendData, sendError, parsePagination, meta } from "./helpers";
import {
  syncAllConfiguredEntitiesToMongo,
  syncEntityFromPrismaToMongo,
} from "../mongo/mirror.service";
import {
  getMongoModelForEntity,
  listPrismaSyncEntities,
  PrismaSyncEntity,
} from "../mongo/entity-models";
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
  "/:entityType",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const entityType = req.params.entityType as PrismaSyncEntity;
      if (!allowedEntities.has(entityType)) {
        return sendError(res, "BAD_REQUEST", "Unknown entityType", 400);
      }
      const mongoModel = getMongoModelForEntity(entityType);
      const { page, limit, skip } = parsePagination(
        req.query as Record<string, unknown>,
      );
      const total = await mongoModel.countDocuments();
      const rows = await mongoModel
        .find()
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      sendData(
        res,
        rows,
        200,
        meta(page, limit, total),
      );
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/:entityType/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await ensureMongo(res))) return;
      const schema = z.object({
        entityType: z.string().min(1),
        id: z.string().min(1),
      });
      const params = schema.parse(req.params);
      if (!allowedEntities.has(params.entityType as PrismaSyncEntity)) {
        return sendError(res, "BAD_REQUEST", "Unknown entityType", 400);
      }
      const mongoModel = getMongoModelForEntity(
        params.entityType as PrismaSyncEntity,
      );
      const row = await mongoModel.findOne({ id: params.id }).lean();
      if (!row) {
        return sendError(res, "NOT_FOUND", "Mongo mirror record not found", 404);
      }
      sendData(res, row);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
