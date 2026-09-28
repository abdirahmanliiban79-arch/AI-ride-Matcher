import type { AuthResponse, User, UserRole } from '@/types/api';
import { apiRequest } from './client';

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

export function register(input: RegisterInput): Promise<{ user: User }> {
  return apiRequest('/auth/register', { method: 'POST', body: input });
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiRequest('/auth/login', { method: 'POST', body: input });
}

export function getMe(token: string): Promise<{ user: User }> {
  return apiRequest('/auth/me', { token });
}