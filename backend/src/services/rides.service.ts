import type { ObjectId } from 'mongodb';

import { findDriverById, findDriverByUserId } from '../repositories/drivers.repository';
import { createRide, findRideById, updateRideIfStatus } from '../repositories/rides.repository';
import { findUserById } from '../repositories/users.repository';
import type { VehicleType } from '../types/driver.types';
import type { Coordinate } from '../types/location.types';
import type { RideDocument, RideStatus } from '../types/ride.types';
import type { AuthUser } from '../types/user.types';
import { AppError } from '../utils/AppError';
import { toObjectId } from '../utils/objectId';
import { releaseDriver } from './drivers.service';
import {
  DRIVER_CANCELLABLE_STATUSES,
  PASSENGER_CANCELLABLE_STATUSES,
  assertRideTransition,
} from './rideStateMachine';

export type CreateRideInput = {
  pickup: Coordinate;
  destination: Coordinate;
  maxPrice: number;
  preferredVehicleType: VehicleType;
  maxWaitTime: number;
};

export type RideDriverSummary = {
  id: string;
  name: string;
  vehicleType: VehicleType;
  rating: number;
};

export type RideView = {
  id: string;
  passengerId: string;
  pickup: Coordinate;
  destination: Coordinate;
  maxPrice: number;
  preferredVehicleType: VehicleType;
  maxWaitTime: number;
  status: RideStatus;
  assignedDriverId: string | null;
  driver: RideDriverSummary | null;
  createdAt: Date;
  updatedAt: Date;
};

function toRideView(ride: RideDocument, driver: RideDriverSummary | null): RideView {
  return {
    id: ride._id.toHexString(),
    passengerId: ride.passengerId.toHexString(),
    pickup: ride.pickup,
    destination: ride.destination,
    maxPrice: ride.maxPrice,
    preferredVehicleType: ride.preferredVehicleType,
    maxWaitTime: ride.maxWaitTime,
    status: ride.status,
    assignedDriverId: ride.assignedDriverId ? ride.assignedDriverId.toHexString() : null,
    driver,
    createdAt: ride.createdAt,
    updatedAt: ride.updatedAt,
  };
}

async function buildDriverSummary(driverId: ObjectId | null): Promise<RideDriverSummary | null> {
  if (!driverId) {
    return null;
  }

  const driver = await findDriverById(driverId.toHexString());
  if (!driver) {
    return null;
  }

  const user = await findUserById(driver.userId.toHexString());

  return {
    id: driver._id.toHexString(),
    name: user ? user.name : 'Unknown driver',
    vehicleType: driver.vehicleType,
    rating: driver.rating,
  };
}

export async function buildRideView(ride: RideDocument): Promise<RideView> {
  const driver = await buildDriverSummary(ride.assignedDriverId);

  return toRideView(ride, driver);
}

async function loadRideOrThrow(rideId: string): Promise<RideDocument> {
  const ride = await findRideById(rideId);
  if (!ride) {
    throw new AppError(404, 'RIDE_NOT_FOUND', 'Ride was not found');
  }

  return ride;
}

async function findActorDriverId(actor: AuthUser): Promise<ObjectId | null> {
  if (actor.role !== 'driver') {
    return null;
  }

  const driver = await findDriverByUserId(actor.id);

  return driver ? driver._id : null;
}

export async function createRideForPassenger(
  passengerId: string,
  input: CreateRideInput,
): Promise<RideView> {
  const ride = await createRide({
    passengerId: toObjectId(passengerId),
    pickup: input.pickup,
    destination: input.destination,
    maxPrice: input.maxPrice,
    preferredVehicleType: input.preferredVehicleType,
    maxWaitTime: input.maxWaitTime,
    status: 'REQUESTED',
    assignedDriverId: null,
  });

  return buildRideView(ride);
}

export async function getRideForActor(rideId: string, actor: AuthUser): Promise<RideView> {
  const ride = await loadRideOrThrow(rideId);

  if (actor.role === 'passenger') {
    if (ride.passengerId.toHexString() !== actor.id) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this ride');
    }
  } else {
    const driverId = await findActorDriverId(actor);
    if (!driverId || !ride.assignedDriverId || !ride.assignedDriverId.equals(driverId)) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this ride');
    }
  }

  return buildRideView(ride);
}

export async function acceptRideByDriver(rideId: string, driverUserId: string): Promise<RideView> {
  const ride = await loadRideOrThrow(rideId);

  const driver = await findDriverByUserId(driverUserId);
  if (!driver) {
    throw new AppError(404, 'DRIVER_PROFILE_NOT_FOUND', 'Driver profile was not found');
  }

  if (!ride.assignedDriverId || !ride.assignedDriverId.equals(driver._id)) {
    throw new AppError(403, 'FORBIDDEN', 'This ride is not assigned to you');
  }

  assertRideTransition(ride.status, 'ACCEPTED');

  const updated = await updateRideIfStatus(ride._id.toHexString(), 'MATCHED', { status: 'ACCEPTED' });
  if (!updated) {
    throw new AppError(409, 'RIDE_STATUS_CONFLICT', 'Ride status changed, please try again');
  }

  return buildRideView(updated);
}

export async function cancelRideForActor(rideId: string, actor: AuthUser): Promise<RideView> {
  const ride = await loadRideOrThrow(rideId);

  if (actor.role === 'passenger') {
    if (ride.passengerId.toHexString() !== actor.id) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this ride');
    }

    if (!PASSENGER_CANCELLABLE_STATUSES.includes(ride.status)) {
      throw new AppError(
        409,
        'INVALID_RIDE_TRANSITION',
        `Cannot cancel a ride with status ${ride.status}`,
      );
    }
  } else {
    const driverId = await findActorDriverId(actor);
    if (!driverId || !ride.assignedDriverId || !ride.assignedDriverId.equals(driverId)) {
      throw new AppError(403, 'FORBIDDEN', 'This ride is not assigned to you');
    }

    if (!DRIVER_CANCELLABLE_STATUSES.includes(ride.status)) {
      throw new AppError(
        409,
        'INVALID_RIDE_TRANSITION',
        `Cannot cancel a ride with status ${ride.status}`,
      );
    }
  }

  const updated = await updateRideIfStatus(ride._id.toHexString(), ride.status, {
    status: 'CANCELLED',
  });
  if (!updated) {
    throw new AppError(409, 'RIDE_STATUS_CONFLICT', 'Ride status changed, please try again');
  }

  if (updated.assignedDriverId) {
    await releaseDriver(updated.assignedDriverId);
  }

  return buildRideView(updated);
}