import type { VehicleType } from '../../types/driver.types';

const BASE_FARE = 2;
const AVERAGE_SPEED_KM_PER_HOUR = 30;

const PER_KM_RATE_BY_VEHICLE_TYPE: Record<VehicleType, number> = {
  economy: 0.5,
  comfort: 0.75,
  xl: 1,
};

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

export function estimateFare(distanceKm: number, vehicleType: VehicleType): number {
  return roundTo(BASE_FARE + PER_KM_RATE_BY_VEHICLE_TYPE[vehicleType] * distanceKm, 2);
}

export function estimateArrivalMinutes(distanceKm: number): number {
  return roundTo((distanceKm / AVERAGE_SPEED_KM_PER_HOUR) * 60, 1);
}