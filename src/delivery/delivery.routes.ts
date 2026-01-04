import { Router } from "express";
import { DeliveryController } from "./delivery.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/delivery:
 *   post:
 *     summary: Create delivery record with newborns
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               pregnancyId:
 *                 type: string
 *                 format: uuid
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *               amtsl:
 *                 type: string
 *                 enum: [Ergomtrine, Oxytocine, Misoprostol]
 *               placenta:
 *                 type: string
 *                 enum: [Completed, Incomplete, CCT, MRP]
 *               newborns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     quantity:
 *                       type: string
 *                       enum: [Single, Multiple]
 *                     sex:
 *                       type: string
 *                       enum: [Male, Female]
 *                     birthWeightGm:
 *                       type: number
 *     responses:
 *       201:
 *         description: Delivery record created successfully
 */
router.post("/", authenticate, DeliveryController.create);

/**
 * @swagger
 * /api/v1/delivery/{id}:
 *   get:
 *     summary: Get delivery by ID
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Delivery details
 */
router.get("/:id", authenticate, DeliveryController.getOne);

/**
 * @swagger
 * /api/v1/delivery/patient/{patientId}:
 *   get:
 *     summary: Get all deliveries for a patient
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of deliveries
 */
router.get(
  "/patient/:patientId",
  authenticate,
  DeliveryController.getByPatient
);

/**
 * @swagger
 * /api/v1/delivery/pregnancy/{pregnancyId}:
 *   get:
 *     summary: Get all deliveries for a pregnancy
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pregnancyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of deliveries
 */
router.get(
  "/pregnancy/:pregnancyId",
  authenticate,
  DeliveryController.getByPregnancy
);

/**
 * @swagger
 * /api/v1/delivery/{id}:
 *   patch:
 *     summary: Update delivery record
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Delivery updated successfully
 */
router.patch("/:id", authenticate, DeliveryController.update);

/**
 * @swagger
 * /api/v1/delivery/{id}:
 *   delete:
 *     summary: Delete delivery record
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Delivery deleted successfully
 */
router.delete("/:id", authenticate, DeliveryController.delete);

export default router;
