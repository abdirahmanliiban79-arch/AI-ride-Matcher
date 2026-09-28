import type { ObjectId } from 'mongodb';

import {
  claimAvailableDriver,
  createDriver,
  findAvailableDrivers,
  findDriverByUserId,
  setDriverAvailabilityById,
  updateDriverAvailability,
  updateDriverLocation,
} from '../repositories/drivers.repository';
import type { DriverDocument, VehicleType } from '../types/driver.types';
import type { Coordinate } from '../types/location.types';
import { AppError } from '../utils/AppError';
import { isDuplicateKeyError } from '../utils/mongoErrors';

const DEFAULT_VEHICLE_TYPE: VehicleType = 'economy';
const DEFAULT_RATING = 5;

export type DriverProfile = {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  rating: number;
  isAvailable: boolean;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
};

function toDriverProfile(driver: DriverDocument): DriverProfile {
  return {
    id: driver._id.toHexString(),
    userId: driver.userId.toHexString(),
    vehicleType: driver.vehicleType,
    rating: driver.rating,
    isAvailable: driver.isAvailable,
    latitude: driver.latitude,
    longitude: driver.longitude,
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };
}

export async function createInitialDriverProfile(userId: ObjectId): Promise<void> {
  try {
    await createDriver({
      userId,
      vehicleType: DEFAULT_VEHICLE_TYPE,
      rating: DEFAULT_RATING,
      isAvailable: false,
      latitude: 0,
      longitude: 0,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }
  }
}

export async function getDriverProfileByUserId(userId: string): Promise<DriverProfile> {
  const driver = await findDriverByUserId(userId);
  if (!driver) {
    throw new AppError(404, 'DRIVER_PROFILE_NOT_FOUND', 'Driver profile was not found');
  }

  return toDriverProfile(driver);
}

export async function listAvailableDrivers(): Promise<DriverProfile[]> {
  const drivers = await findAvailableDrivers();

  return drivers.map(toDriverProfile);
}

export async function releaseDriver(driverId: ObjectId): Promise<void> {
  await setDriverAvailabilityById(driverId, true);
}

export async function claimDriver(driverId: ObjectId): Promise<DriverDocument | null> {
  return claimAvailableDriver(driverId);
}

export async function setDriverAvailability(
  userId: string,
  isAvailable: boolean,
): Promise<DriverProfile> {
  const driver = await updateDriverAvailability(userId, isAvailable);
  if (!driver) {
    throw new AppError(404, 'DRIVER_PROFILE_NOT_FOUND', 'Driver profile was not found');
  }

  return toDriverProfile(driver);
}

export async function setDriverLocation(
  userId: string,
  location: Coordinate,
): Promise<DriverProfile> {
  const driver = await updateDriverLocation(userId, location);
  if (!driver) {
    throw new AppError(404, 'DRIVER_PROFILE_NOT_FOUND', 'Driver profile was not found');
  }

  return toDriverProfile(driver);
}