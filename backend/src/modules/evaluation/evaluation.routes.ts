import { Router, Request, Response } from 'express';
import { env } from '../../config/env';

const router = Router();

/**
 * @swagger
 * /api/evaluation:
 *   get:
 *     summary: Evaluation endpoint with candidate info and implemented features
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: Candidate and project information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 candidateName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 repositoryUrl:
 *                   type: string
 *                 deployedUrl:
 *                   type: string
 *                 externalIntegration:
 *                   type: string
 *                 features:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    candidateName: env.CANDIDATE_NAME,
    email: env.CANDIDATE_EMAIL,
    repositoryUrl: env.REPOSITORY_URL,
    deployedUrl: env.DEPLOYED_URL,
    externalIntegration: 'Telegram Bot API',
    features: [
      'JWT Authentication',
      'Meeting Management with Transcript Storage',
      'AI Meeting Analysis (Gemini 1.5 Flash)',
      'Grounded Insights with Transcript Citations',
      'Hallucination Prevention via Prompt Engineering + Output Validation',
      'Action Item Management (PENDING / IN_PROGRESS / COMPLETED)',
      'Overdue Action Item Detection',
      'Scheduled Reminder Job (node-cron, hourly)',
      'Telegram Bot Reminder Integration',
      'Unified API Response Format with Trace IDs',
      'Structured Logging (Winston)',
      'OpenAPI / Swagger Documentation',
      'Global Error Handling',
      'Input Validation (Joi)',
      'Pagination and Filtering',
      'CI/CD Pipeline (GitHub Actions)',
      'Redis Caching ',
      'Rate Limiting (express-rate-limit with Redis store)',
    ],
  });
});

export default router;
