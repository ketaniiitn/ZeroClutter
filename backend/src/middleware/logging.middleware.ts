import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../utils/logger';

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const traceId = res.locals.traceId || '';

    requestLogger(
      traceId,
      req.method,
      req.path,
      res.statusCode,
      durationMs,
    );
  });

  next();
};
