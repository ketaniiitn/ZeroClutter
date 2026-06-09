import { Router } from 'express';
import { create, getOne, list } from './meeting.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { analyzeMeeting } from '../analysis/analysis.controller';
import { analyzeRateLimit } from '../../middleware/rate-limit.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Create a new meeting with transcript
 *     tags: [Meetings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, participants, meetingDate, transcript]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Sprint Planning
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 example: ["alice@example.com", "bob@example.com"]
 *               meetingDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-20T10:00:00Z"
 *               transcript:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TranscriptSegment'
 *     responses:
 *       201:
 *         description: Meeting created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', create);

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: List all meetings with pagination
 *     tags: [Meetings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter meetings from this date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter meetings until this date
 *     responses:
 *       200:
 *         description: Paginated list of meetings
 *       401:
 *         description: Unauthorized
 */
router.get('/', list);

/**
 * @swagger
 * /api/meetings/{id}:
 *   get:
 *     summary: Get a single meeting by ID
 *     tags: [Meetings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting details including transcript and analysis
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', getOne);

/**
 * @swagger
 * /api/meetings/{id}/analyze:
 *   post:
 *     summary: Trigger AI analysis of a meeting transcript
 *     tags: [Meetings, AI Analysis]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI analysis with citations for summary, action items, decisions, and follow-ups
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 *       502:
 *         description: AI service error
 */
router.post('/:id/analyze', analyzeRateLimit, analyzeMeeting);

export default router;
