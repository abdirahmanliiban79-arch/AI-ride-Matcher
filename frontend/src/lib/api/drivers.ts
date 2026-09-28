import type { Coordinate, DriverProfile } from '@/types/api';
import { apiRequest } from './client';

export function getDriverProfile(token: string): Promise<{ driver: DriverProfile }> {
  return apiRequest('/drivers/me', { token });
}

export function updateAvailability(
  token: string,
  isAvailable: boolean,
): Promise<{ driver: DriverProfile }> {
  return apiRequest('/drivers/me/availability', {
    method: 'PATCH',
    body: { isAvailable },
    token,
  });
}

export function updateLocation(
  token: string,
  location: Coordinate,
): Promise<{ driver: DriverProfile }> {
  return apiRequest('/drivers/me/location', {
    method: 'PATCH',
    body: location,
    token,
  });
}