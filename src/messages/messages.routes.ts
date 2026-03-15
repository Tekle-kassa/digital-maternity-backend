import { Router } from "express";
import { MessagesController } from "./messages.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/messages/conversations:
 *   get:
 *     summary: List my conversations (inbox/outbox, optional search)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           enum: [inbox, outbox]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of conversations with last message and unread count
 */
router.get(
  "/conversations",
  authenticate,
  MessagesController.listConversations
);

/**
 * @swagger
 * /api/v1/messages/conversations:
 *   post:
 *     summary: Get or create a conversation with another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otherUserId]
 *             properties:
 *               otherUserId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Conversation (existing or newly created)
 */
router.post(
  "/conversations",
  authenticate,
  MessagesController.getOrCreateConversation
);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}:
 *   get:
 *     summary: Get one conversation
 *     tags: [Messages]
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
 *         description: Conversation details
 */
router.get(
  "/conversations/:id",
  authenticate,
  MessagesController.getConversation
);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}/messages:
 *   get:
 *     summary: List messages in a conversation (paginated)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Messages in chronological order
 */
router.get(
  "/conversations/:id/messages",
  authenticate,
  MessagesController.listMessages
);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body:
 *                 type: string
 *               attachmentUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Message created
 */
router.post(
  "/conversations/:id/messages",
  authenticate,
  MessagesController.sendMessage
);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}/read:
 *   patch:
 *     summary: Mark all messages in conversation as read
 *     tags: [Messages]
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
 *         description: OK
 */
router.patch(
  "/conversations/:id/read",
  authenticate,
  MessagesController.markConversationAsRead
);

/**
 * @swagger
 * /api/v1/messages/messages/{id}/read:
 *   patch:
 *     summary: Mark a message as read
 *     tags: [Messages]
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
 *         description: OK
 */
router.patch(
  "/messages/:id/read",
  authenticate,
  MessagesController.markAsRead
);

export default router;
