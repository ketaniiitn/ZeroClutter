import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const traceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const traceId =
    (req.headers['x-trace-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    uuidv4();

  res.locals.traceId = traceId;
  res.setHeader('x-trace-id', traceId);

  next();
};
