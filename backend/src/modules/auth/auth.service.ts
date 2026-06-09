import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError } from '../../utils/errors';

const SALT_ROUNDS = 12;

export const registerUser = async (
  name: string,
  email: string,
  password: string,
) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = signToken(user.id, user.email, user.name);
  return { user, token };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = signToken(user.id, user.email, user.name);
  return {
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    token,
  };
};

const signToken = (id: string, email: string, name: string): string =>
  jwt.sign({ id, email, name }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
