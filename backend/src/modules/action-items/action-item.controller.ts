import { Response, NextFunction } from 'express';
import {
  createActionItemSchema,
  updateStatusSchema,
  listActionItemsSchema,
} from './action-item.validation';
import {
  createActionItem,
  updateActionItemStatus,
  listActionItems,
  getOverdueActionItems,
} from './action-item.service';
import { sendSuccess } from '../../utils/response';
import { ValidationError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../types';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = createActionItemSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new ValidationError(error.details.map((d) => d.message).join('; '));
    }

    const item = await createActionItem(
      req.user!.id,
      value.task,
      value.assignee,
      value.meetingId,
      value.citations || [],
      value.dueDate,
    );

    sendSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = updateStatusSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new ValidationError(error.details.map((d) => d.message).join('; '));
    }

    const item = await updateActionItemStatus(req.params.id as string, req.user!.id, value.status);
    sendSuccess(res, item);
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
    const { error, value } = listActionItemsSchema.validate(req.query, { abortEarly: false });
    if (error) {
      throw new ValidationError(error.details.map((d) => d.message).join('; '));
    }

    const result = await listActionItems(req.user!.id, value.page, value.limit, {
      status: value.status,
      assignee: value.assignee,
      meetingId: value.meetingId,
    });

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const overdue = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const items = await getOverdueActionItems(req.user!.id);
    sendSuccess(res, { items, count: items.length });
  } catch (err) {
    next(err);
  }
};
