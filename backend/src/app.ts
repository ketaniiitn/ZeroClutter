import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { traceMiddleware } from './middleware/trace.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { globalRateLimit } from './middleware/rate-limit.middleware';

import authRoutes from './modules/auth/auth.routes';
import meetingRoutes from './modules/meetings/meeting.routes';
import actionItemRoutes from './modules/action-items/action-item.routes';
import healthRoutes from './modules/health/health.routes';
import evaluationRoutes from './modules/evaluation/evaluation.routes';

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trace ID must come before logging
app.use(traceMiddleware);
app.use(loggingMiddleware);

// Global rate limit applied to all routes
app.use(globalRateLimit);

// Swagger docs (publicly accessible, no auth)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Hintro Meeting Intelligence API',
  swaggerOptions: { persistAuthorization: true },
}));

// Health (no auth)
app.use('/health', healthRoutes);

// Evaluation (no auth)
app.use('/api/evaluation', evaluationRoutes);

// Application routes
app.use('/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/action-items', actionItemRoutes);

// 404 for unmatched routes
app.use(notFoundMiddleware);

// Global error handler (must be last)
app.use(errorMiddleware);

export default app;
