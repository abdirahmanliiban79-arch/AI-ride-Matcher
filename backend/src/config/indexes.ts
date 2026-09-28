import type { Db } from 'mongodb';

import type { DriverDocument } from '../types/driver.types';
import type { RideDocument } from '../types/ride.types';
import type { RideMatchDocument } from '../types/rideMatch.types';
import type { UserDocument } from '../types/user.types';
import { COLLECTIONS } from './collections';

export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection<UserDocument>(COLLECTIONS.users).createIndex({ phone: 1 }, { unique: true }),
    db.collection<DriverDocument>(COLLECTIONS.drivers).createIndex({ userId: 1 }, { unique: true }),
    db.collection<DriverDocument>(COLLECTIONS.drivers).createIndex({ isAvailable: 1 }),
    db.collection<RideDocument>(COLLECTIONS.rides).createIndex({ passengerId: 1 }),
    db.collection<RideDocument>(COLLECTIONS.rides).createIndex({ assignedDriverId: 1 }),
    db.collection<RideMatchDocument>(COLLECTIONS.rideMatches).createIndex({ rideId: 1 }),
  ]);
}