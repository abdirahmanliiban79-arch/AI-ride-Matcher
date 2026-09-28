import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { createUser, findUserById, findUserByPhone } from '../repositories/users.repository';
import type { UserDocument, UserRole } from '../types/user.types';
import { AppError } from '../utils/AppError';
import { isDuplicateKeyError } from '../utils/mongoErrors';
import { createInitialDriverProfile } from './drivers.service';

const PASSWORD_SALT_ROUNDS = 10;
const TOKEN_TTL = '7d';

export type RegisterInput = {
  name: string;
  phone: string;
  password: string;
  role: UserRole;
};

export type LoginInput = {
  phone: string;
  password: string;
};

export type PublicUser = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toHexString(),
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const existingUser = await findUserByPhone(input.phone);
  if (existingUser) {
    throw new AppError(
      409,
      'PHONE_ALREADY_REGISTERED',
      'A user with this phone number already exists',
    );
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

  try {
    const user = await createUser({
      name: input.name,
      phone: input.phone,
      passwordHash,
      role: input.role,
    });

    if (user.role === 'driver') {
      await createInitialDriverProfile(user._id);
    }

    return toPublicUser(user);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        409,
        'PHONE_ALREADY_REGISTERED',
        'A user with this phone number already exists',
      );
    }

    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<{ token: string; user: PublicUser }> {
  const user = await findUserByPhone(input.phone);
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid phone number or password');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid phone number or password');
  }

  const token = jwt.sign({ sub: user._id.toHexString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });

  return { token, user: toPublicUser(user) };
}

export async function getUserProfile(userId: string): Promise<PublicUser> {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User was not found');
  }

  return toPublicUser(user);
}