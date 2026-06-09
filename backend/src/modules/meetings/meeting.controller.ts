import { Response, NextFunction } from 'express';
import { createMeetingSchema, listMeetingsSchema } from './meeting.validation';
import { createMeeting, getMeetingById, listMeetings } from './meeting.service';
import { sendSuccess } from '../../utils/response';
import { ValidationError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../types';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = createMeetingSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      throw new ValidationError(messages);
    }

    const meeting = await createMeeting(
      req.user!.id,
      value.title,
      value.participants,
      value.meetingDate,
      value.transcript,
    );

    sendSuccess(res, meeting, 201);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const meeting = await getMeetingById(req.params.id as string, req.user!.id);
    sendSuccess(res, meeting);
  } catch (err) {
    next(err);
  }
};

export const list = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = listMeetingsSchema.validate(req.query, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      throw new ValidationError(messages);
    }

    const result = await listMeetings(
      req.user!.id,
      value.page,
      value.limit,
      value.from,
      value.to,
    );

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
