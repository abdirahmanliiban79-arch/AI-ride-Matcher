import type { ObjectId } from 'mongodb';

export const USER_ROLES = ['passenger', 'driver'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AuthUser = {
  id: string;
  role: UserRole;
};

export type UserDocument = {
  _id: ObjectId;
  name: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};