import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: unknown,
  statusCode = 200,
  traceId?: string,
): void => {
  res.status(statusCode).json({
    traceId: traceId || res.locals.traceId || '',
    success: true,
    data,
  });
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  traceId?: string,
): void => {
  res.status(statusCode).json({
    traceId: traceId || res.locals.traceId || '',
    success: false,
    error: { code, message },
  });
};

export const paginatedResponse = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
) => ({
  items,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});
