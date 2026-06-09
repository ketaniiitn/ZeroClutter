import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from './auth.validation';
import { registerUser, loginUser } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { ValidationError } from '../../utils/errors';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      throw new ValidationError(messages);
    }

    const result = await registerUser(value.name, value.email, value.password);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      throw new ValidationError(messages);
    }

    const result = await loginUser(value.email, value.password);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};
