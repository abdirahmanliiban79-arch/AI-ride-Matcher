import type { DriverDocument, VehicleType } from '../../types/driver.types';
import type { Coordinate } from '../../types/location.types';
import { haversineDistanceKm } from '../../utils/distance';
import { estimateArrivalMinutes, estimateFare } from './estimates';

export type RideRequirements = {
  pickup: Coordinate;
  destination: Coordinate;
  maxPrice: number;
  preferredVehicleType: VehicleType;
  maxWaitTime: number;
};

export type DriverCandidate = {
  driverId: string;
  distanceFromPickup: number;
  estimatedArrivalMinutes: number;
  price: number;
  rating: number;
  vehicleType: VehicleType;
};

function hasValidCoordinates(driver: DriverDocument): boolean {
  const { latitude, longitude } = driver;

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function distanceFromPickupKm(driver: DriverDocument, pickup: Coordinate): number {
  return haversineDistanceKm(
    { latitude: driver.latitude, longitude: driver.longitude },
    pickup,
  );
}

export function satisfiesRideConstraints(
  requirements: RideRequirements,
  driver: DriverDocument,
): boolean {
  if (driver.vehicleType !== requirements.preferredVehicleType) {
    return false;
  }

  if (!hasValidCoordinates(driver)) {
    return false;
  }

  const distanceKm = distanceFromPickupKm(driver, requirements.pickup);
  if (estimateArrivalMinutes(distanceKm) > requirements.maxWaitTime) {
    return false;
  }

  if (estimateFare(distanceKm, driver.vehicleType) > requirements.maxPrice) {
    return false;
  }

  return true;
}

export function buildDriverCandidate(
  requirements: RideRequirements,
  driver: DriverDocument,
): DriverCandidate | null {
  if (!driver.isAvailable) {
    return null;
  }

  if (!satisfiesRideConstraints(requirements, driver)) {
    return null;
  }

  const distanceKm = distanceFromPickupKm(driver, requirements.pickup);

  return {
    driverId: driver._id.toHexString(),
    distanceFromPickup: roundTo(distanceKm, 2),
    estimatedArrivalMinutes: estimateArrivalMinutes(distanceKm),
    price: estimateFare(distanceKm, driver.vehicleType),
    rating: driver.rating,
    vehicleType: driver.vehicleType,
  };
}

export function filterEligibleDrivers(
  requirements: RideRequirements,
  drivers: DriverDocument[],
): DriverCandidate[] {
  const candidates: DriverCandidate[] = [];

  for (const driver of drivers) {
    const candidate = buildDriverCandidate(requirements, driver);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  return candidates;
}