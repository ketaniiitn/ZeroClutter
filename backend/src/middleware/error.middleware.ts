import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  const traceId = res.locals.traceId || '';

  if (err instanceof AppError && err.isOperational) {
    logger.warn('Operational error', {
      traceId,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      traceId,
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  logger.error('Unexpected error', {
    traceId,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    traceId,
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
};

export const notFoundMiddleware = (
  req: Request,
  res: Response,
): void => {
  const traceId = res.locals.traceId || '';
  res.status(404).json({
    traceId,
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};
