import { Router } from 'express';
import { create, updateStatus, list, overdue } from './action-item.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/action-items/overdue:
 *   get:
 *     summary: Get all overdue action items (status != COMPLETED and dueDate < now)
 *     tags: [Action Items]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue action items
 *       401:
 *         description: Unauthorized
 */
router.get('/overdue', overdue);

/**
 * @swagger
 * /api/action-items:
 *   get:
 *     summary: List action items with filtering and pagination
 *     tags: [Action Items]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED]
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *       - in: query
 *         name: meetingId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of action items
 *       401:
 *         description: Unauthorized
 */
router.get('/', list);

/**
 * @swagger
 * /api/action-items:
 *   post:
 *     summary: Create a new action item
 *     tags: [Action Items]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task, assignee, meetingId]
 *             properties:
 *               task:
 *                 type: string
 *                 example: Prepare release notes
 *               assignee:
 *                 type: string
 *                 example: Alice
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2026-06-10T00:00:00Z"
 *               meetingId:
 *                 type: string
 *               citations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                     speaker:
 *                       type: string
 *                     quote:
 *                       type: string
 *     responses:
 *       201:
 *         description: Action item created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', create);

/**
 * @swagger
 * /api/action-items/{id}/status:
 *   patch:
 *     summary: Update the status of an action item
 *     tags: [Action Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Action item not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/status', updateStatus);

export default router;
