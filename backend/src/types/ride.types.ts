import type { ObjectId } from 'mongodb';

import type { VehicleType } from './driver.types';
import type { Coordinate } from './location.types';

export const RIDE_STATUSES = [
  'REQUESTED',
  'MATCHING',
  'MATCHED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export type RideStatus = (typeof RIDE_STATUSES)[number];

export type RideDocument = {
  _id: ObjectId;
  passengerId: ObjectId;
  pickup: Coordinate;
  destination: Coordinate;
  maxPrice: number;
  preferredVehicleType: VehicleType;
  maxWaitTime: number;
  status: RideStatus;
  assignedDriverId: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};