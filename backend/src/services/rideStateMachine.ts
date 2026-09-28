import type { RideStatus } from '../types/ride.types';
import { AppError } from '../utils/AppError';

const TRANSITIONS: Record<RideStatus, readonly RideStatus[]> = {
  REQUESTED: ['MATCHING', 'CANCELLED'],
  MATCHING: ['MATCHED', 'CANCELLED'],
  MATCHED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const PASSENGER_CANCELLABLE_STATUSES: readonly RideStatus[] = [
  'REQUESTED',
  'MATCHING',
  'MATCHED',
  'ACCEPTED',
  'IN_PROGRESS',
];

export const DRIVER_CANCELLABLE_STATUSES: readonly RideStatus[] = ['MATCHED', 'ACCEPTED'];

export function canTransitionRide(from: RideStatus, to: RideStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertRideTransition(from: RideStatus, to: RideStatus): void {
  if (!canTransitionRide(from, to)) {
    throw new AppError(
      409,
      'INVALID_RIDE_TRANSITION',
      `Cannot change ride status from ${from} to ${to}`,
    );
  }
}