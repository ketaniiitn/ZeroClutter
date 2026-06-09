import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hintro Meeting Intelligence API',
      version: '1.0.0',
      description:
        'AI-powered Meeting Intelligence Service — stores meeting transcripts, generates AI-grounded insights, tracks action items, and sends reminders via Telegram.',
      contact: {
        name: env.CANDIDATE_NAME,
        email: env.CANDIDATE_EMAIL,
      },
    },
    servers: [
      {
        url: env.DEPLOYED_URL || 'http://localhost:3000',
        description: 'Primary server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from POST /auth/login',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            traceId: { type: 'string', example: 'abc123-uuid' },
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            traceId: { type: 'string', example: 'abc123-uuid' },
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Meeting title is required' },
              },
            },
          },
        },
        TranscriptSegment: {
          type: 'object',
          required: ['timestamp', 'speaker', 'text'],
          properties: {
            timestamp: { type: 'string', example: '00:10' },
            speaker: { type: 'string', example: 'Alice' },
            text: { type: 'string', example: 'We should launch next Friday.' },
          },
        },
        Meeting: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', example: 'Sprint Planning' },
            participants: {
              type: 'array',
              items: { type: 'string', format: 'email' },
              example: ['alice@example.com', 'bob@example.com'],
            },
            meetingDate: { type: 'string', format: 'date-time' },
            transcript: {
              type: 'array',
              items: { $ref: '#/components/schemas/TranscriptSegment' },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ActionItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            task: { type: 'string', example: 'Prepare release notes' },
            assignee: { type: 'string', example: 'Alice' },
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
            },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            meetingId: { type: 'string' },
            citations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string' },
                  speaker: { type: 'string' },
                  quote: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
