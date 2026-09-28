import { ObjectId } from 'mongodb';

import { COLLECTIONS } from '../config/collections';
import { getDb } from '../config/db';
import type { DriverDocument } from '../types/driver.types';
import type { Coordinate } from '../types/location.types';
import { toObjectId } from '../utils/objectId';

export type CreateDriverInput = Omit<DriverDocument, '_id' | 'createdAt' | 'updatedAt'>;

function driversCollection() {
  return getDb().collection<DriverDocument>(COLLECTIONS.drivers);
}

export async function createDriver(input: CreateDriverInput): Promise<DriverDocument> {
  const now = new Date();
  const doc: DriverDocument = { _id: new ObjectId(), ...input, createdAt: now, updatedAt: now };

  await driversCollection().insertOne(doc);

  return doc;
}

export async function findDriverById(id: string): Promise<DriverDocument | null> {
  return driversCollection().findOne({ _id: toObjectId(id) });
}

export async function findDriverByUserId(userId: string): Promise<DriverDocument | null> {
  return driversCollection().findOne({ userId: toObjectId(userId) });
}

export async function findAvailableDrivers(): Promise<DriverDocument[]> {
  return driversCollection().find({ isAvailable: true }).toArray();
}

export async function updateDriverAvailability(
  userId: string,
  isAvailable: boolean,
): Promise<DriverDocument | null> {
  return driversCollection().findOneAndUpdate(
    { userId: toObjectId(userId) },
    { $set: { isAvailable, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
}

export async function setDriverAvailabilityById(
  driverId: ObjectId,
  isAvailable: boolean,
): Promise<DriverDocument | null> {
  return driversCollection().findOneAndUpdate(
    { _id: driverId },
    { $set: { isAvailable, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
}

export async function claimAvailableDriver(driverId: ObjectId): Promise<DriverDocument | null> {
  return driversCollection().findOneAndUpdate(
    { _id: driverId, isAvailable: true },
    { $set: { isAvailable: false, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
}

export async function updateDriverLocation(
  userId: string,
  location: Coordinate,
): Promise<DriverDocument | null> {
  return driversCollection().findOneAndUpdate(
    { userId: toObjectId(userId) },
    {
      $set: {
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' },
  );
}