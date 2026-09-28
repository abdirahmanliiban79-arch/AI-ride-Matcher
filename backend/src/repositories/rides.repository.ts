import { ObjectId } from 'mongodb';

import { COLLECTIONS } from '../config/collections';
import { getDb } from '../config/db';
import type { RideDocument, RideStatus } from '../types/ride.types';
import { toObjectId } from '../utils/objectId';

export type CreateRideInput = Omit<RideDocument, '_id' | 'createdAt' | 'updatedAt'>;

export type UpdateRideInput = {
  status?: RideStatus;
  assignedDriverId?: ObjectId | null;
};

function ridesCollection() {
  return getDb().collection<RideDocument>(COLLECTIONS.rides);
}

export async function createRide(input: CreateRideInput): Promise<RideDocument> {
  const now = new Date();
  const doc: RideDocument = { _id: new ObjectId(), ...input, createdAt: now, updatedAt: now };

  await ridesCollection().insertOne(doc);

  return doc;
}

export async function findRideById(id: string): Promise<RideDocument | null> {
  return ridesCollection().findOne({ _id: toObjectId(id) });
}

function buildRideSet(
  update: UpdateRideInput,
): Partial<Pick<RideDocument, 'status' | 'assignedDriverId' | 'updatedAt'>> {
  const set: Partial<Pick<RideDocument, 'status' | 'assignedDriverId' | 'updatedAt'>> = {
    updatedAt: new Date(),
  };

  if (update.status !== undefined) {
    set.status = update.status;
  }

  if (update.assignedDriverId !== undefined) {
    set.assignedDriverId = update.assignedDriverId;
  }

  return set;
}

export async function updateRide(id: string, update: UpdateRideInput): Promise<RideDocument | null> {
  return ridesCollection().findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: buildRideSet(update) },
    { returnDocument: 'after' },
  );
}

export async function updateRideIfStatus(
  id: string,
  expectedStatus: RideStatus,
  update: UpdateRideInput,
): Promise<RideDocument | null> {
  return ridesCollection().findOneAndUpdate(
    { _id: toObjectId(id), status: expectedStatus },
    { $set: buildRideSet(update) },
    { returnDocument: 'after' },
  );
}