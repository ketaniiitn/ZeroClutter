import winston from 'winston';
import { env } from '../config/env';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level: env.isProd() ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'hintro-meeting-intelligence' },
  transports: [
    new winston.transports.Console({
      format: env.isDev()
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          )
        : logFormat,
    }),
  ],
});

export const requestLogger = (
  traceId: string,
  method: string,
  path: string,
  status: number,
  durationMs: number,
  error?: string,
) => {
  const payload: Record<string, unknown> = {
    traceId,
    method,
    path,
    status,
    durationMs,
  };
  if (error) payload.error = error;

  if (status >= 500) {
    logger.error('Request completed with server error', payload);
  } else if (status >= 400) {
    logger.warn('Request completed with client error', payload);
  } else {
    logger.info('Request completed', payload);
  }
};
