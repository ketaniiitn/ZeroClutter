import { Router } from 'express';
import { create, getOne, list, leave } from './meeting-bot.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/bots:
 *   post:
 *     summary: Dispatch a bot to join a Google Meet call
 *     tags: [Meeting Bots]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [meetingUrl]
 *             properties:
 *               meetingUrl:
 *                 type: string
 *                 example: https://meet.google.com/abc-defg-hij
 *               displayName:
 *                 type: string
 *                 example: ZeroClutter Notetaker
 *     responses:
 *       202:
 *         description: Bot accepted and dispatched
 *       400:
 *         description: Validation error
 *       503:
 *         description: Redis unavailable
 */
router.post('/', create);

/**
 * @swagger
 * /api/bots:
 *   get:
 *     summary: List the caller's meeting bots (paginated)
 *     tags: [Meeting Bots]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of bots
 */
router.get('/', list);

/**
 * @swagger
 * /api/bots/{id}:
 *   get:
 *     summary: Get a bot's current status
 *     tags: [Meeting Bots]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bot record
 *       404:
 *         description: Bot not found
 */
router.get('/:id', getOne);

/**
 * @swagger
 * /api/bots/{id}/leave:
 *   post:
 *     summary: Signal a live bot to leave the meeting
 *     tags: [Meeting Bots]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       202:
 *         description: Leave signal accepted
 *       404:
 *         description: Bot not found
 */
router.post('/:id/leave', leave);

export default router;
