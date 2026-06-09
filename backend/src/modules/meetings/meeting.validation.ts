import Joi from 'joi';

const transcriptSegmentSchema = Joi.object({
  timestamp: Joi.string().required().messages({
    'any.required': 'Transcript segment timestamp is required',
  }),
  speaker: Joi.string().min(1).max(100).required().messages({
    'any.required': 'Transcript segment speaker is required',
  }),
  text: Joi.string().min(1).required().messages({
    'any.required': 'Transcript segment text is required',
  }),
});

export const createMeetingSchema = Joi.object({
  title: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Title must be at least 2 characters',
    'any.required': 'Meeting title is required',
  }),
  participants: Joi.array()
    .items(Joi.string().email().messages({ 'string.email': 'Each participant must be a valid email address' }))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one participant is required',
      'any.required': 'Participants are required',
    }),
  meetingDate: Joi.string().isoDate().required().messages({
    'string.isoDate': 'meetingDate must be a valid ISO 8601 date',
    'any.required': 'Meeting date is required',
  }),
  transcript: Joi.array()
    .items(transcriptSegmentSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'Transcript must contain at least one segment',
      'any.required': 'Transcript is required',
    }),
});

export const listMeetingsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  from: Joi.string().isoDate().optional(),
  to: Joi.string().isoDate().optional(),
});
