import Joi from 'joi';

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;

const citationSchema = Joi.object({
  timestamp: Joi.string().required(),
  speaker: Joi.string().optional(),
  quote: Joi.string().optional(),
});

export const createActionItemSchema = Joi.object({
  task: Joi.string().min(3).max(500).required().messages({
    'string.min': 'Task must be at least 3 characters',
    'any.required': 'Task is required',
  }),
  assignee: Joi.string().min(1).max(100).required().messages({
    'any.required': 'Assignee is required',
  }),
  dueDate: Joi.string().isoDate().optional().allow(null).messages({
    'string.isoDate': 'dueDate must be a valid ISO 8601 date',
  }),
  meetingId: Joi.string().required().messages({
    'any.required': 'meetingId is required',
  }),
  citations: Joi.array().items(citationSchema).default([]),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...VALID_STATUSES)
    .required()
    .messages({
      'any.only': `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      'any.required': 'Status is required',
    }),
});

export const listActionItemsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...VALID_STATUSES).optional(),
  assignee: Joi.string().optional(),
  meetingId: Joi.string().optional(),
});
