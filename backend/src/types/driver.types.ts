import type { ObjectId } from 'mongodb';

export const VEHICLE_TYPES = ['economy', 'comfort', 'xl'] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

export type DriverDocument = {
  _id: ObjectId;
  userId: ObjectId;
  vehicleType: VehicleType;
  rating: number;
  isAvailable: boolean;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
};