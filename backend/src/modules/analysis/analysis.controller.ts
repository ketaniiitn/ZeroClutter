import { Response, NextFunction } from 'express';
import { analyzeMeetingById } from './analysis.service';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export const analyzeMeeting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await analyzeMeetingById(req.params.id as string, req.user!.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
