import Joi from 'joi';

const GOOGLE_MEET_URL = /^https:\/\/meet\.google\.com\/[a-z0-9-]+(\?.*)?$/i;

export const createBotSchema = Joi.object({
  meetingUrl: Joi.string()
    .pattern(GOOGLE_MEET_URL)
    .required()
    .messages({
      'string.pattern.base': 'meetingUrl must be a valid Google Meet URL (https://meet.google.com/...)',
      'any.required': 'Meeting URL is required',
    }),
  displayName: Joi.string().min(1).max(100).optional().messages({
    'string.max': 'displayName must be at most 100 characters',
  }),
});

export const listBotsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});
