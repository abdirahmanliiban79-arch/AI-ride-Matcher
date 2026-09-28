import { z } from 'zod';

import { USER_ROLES } from '../types/user.types';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  phone: z.string().trim().min(3, 'Phone number is too short').max(30),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  role: z.enum(USER_ROLES),
});

export const loginSchema = z.object({
  phone: z.string().trim().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;