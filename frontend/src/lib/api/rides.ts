import type { Coordinate, MatchOutcome, Ride, VehicleType } from '@/types/api';
import { apiRequest } from './client';

export type CreateRideInput = {
  pickup: Coordinate;
  destination: Coordinate;
  maxPrice: number;
  preferredVehicleType: VehicleType;
  maxWaitTime: number;
};

export function createRide(token: string, input: CreateRideInput): Promise<{ ride: Ride }> {
  return apiRequest('/rides', { method: 'POST', body: input, token });
}

export function getRide(token: string, rideId: string): Promise<{ ride: Ride }> {
  return apiRequest(`/rides/${rideId}`, { token });
}

export function matchRide(token: string, rideId: string): Promise<MatchOutcome> {
  return apiRequest(`/rides/${rideId}/match`, { method: 'POST', token });
}

export function acceptRide(token: string, rideId: string): Promise<{ ride: Ride }> {
  return apiRequest(`/rides/${rideId}/accept`, { method: 'POST', token });
}

export function cancelRide(token: string, rideId: string): Promise<{ ride: Ride }> {
  return apiRequest(`/rides/${rideId}/cancel`, { method: 'POST', token });
}