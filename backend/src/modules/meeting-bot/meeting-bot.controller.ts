import { Response, NextFunction } from 'express';
import { createBotSchema, listBotsSchema } from './meeting-bot.validation';
import { createBot, getBotById, listBots, requestLeave } from './meeting-bot.service';
import { sendSuccess } from '../../utils/response';
import { ValidationError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../types';
import { env } from '../../config/env';

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = createBotSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new ValidationError(error.details.map((d) => d.message).join('; '));
    }
    const bot = await createBot(req.user!.id, value.meetingUrl, value.displayName || env.BOT_DEFAULT_NAME);
    sendSuccess(res, bot, 202);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bot = await getBotById(req.params.id as string, req.user!.id);
    sendSuccess(res, bot);
  } catch (err) {
    next(err);
  }
};

export const list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = listBotsSchema.validate(req.query, { abortEarly: false });
    if (error) {
      throw new ValidationError(error.details.map((d) => d.message).join('; '));
    }
    const result = await listBots(req.user!.id, value.page, value.limit);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const leave = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bot = await requestLeave(req.params.id as string, req.user!.id);
    sendSuccess(res, bot, 202);
  } catch (err) {
    next(err);
  }
};
