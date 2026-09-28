import { ObjectId } from 'mongodb';

import { COLLECTIONS } from '../config/collections';
import { getDb } from '../config/db';
import type { RideMatchDocument } from '../types/rideMatch.types';
import { toObjectId } from '../utils/objectId';

export type CreateRideMatchInput = Omit<RideMatchDocument, '_id' | 'createdAt'>;

function rideMatchesCollection() {
  return getDb().collection<RideMatchDocument>(COLLECTIONS.rideMatches);
}

export async function createRideMatch(input: CreateRideMatchInput): Promise<RideMatchDocument> {
  const createdAt = new Date();
  const doc: RideMatchDocument = { _id: new ObjectId(), ...input, createdAt };

  await rideMatchesCollection().insertOne(doc);

  return doc;
}

export async function findRideMatchesByRideId(rideId: string): Promise<RideMatchDocument[]> {
  return rideMatchesCollection()
    .find({ rideId: toObjectId(rideId) })
    .sort({ createdAt: -1 })
    .toArray();
}