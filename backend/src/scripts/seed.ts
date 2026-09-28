import bcrypt from 'bcryptjs';

import { COLLECTIONS } from '../config/collections';
import { connectToDatabase, disconnectFromDatabase, getDb } from '../config/db';
import { ensureIndexes } from '../config/indexes';
import { createDriver } from '../repositories/drivers.repository';
import { createUser } from '../repositories/users.repository';
import { estimateArrivalMinutes, estimateFare } from '../services/matching/estimates';
import type { DriverDocument, VehicleType } from '../types/driver.types';
import type { UserDocument } from '../types/user.types';
import { haversineDistanceKm } from '../utils/distance';

const PASSWORD_SALT_ROUNDS = 10;
const DEMO_PICKUP = { latitude: 0, longitude: 0 };

type SeedDriver = {
  name: string;
  phone: string;
  vehicleType: VehicleType;
  rating: number;
  isAvailable: boolean;
  latitude: number;
  longitude: number;
  note: string;
};

const PASSENGER = {
  name: 'Amina Passenger',
  phone: '+15550000001',
  password: 'passenger123',
};

const DRIVER_PASSWORD = 'driver123';

const DRIVERS: SeedDriver[] = [
  {
    name: 'Farah Warsame',
    phone: '+15550001001',
    vehicleType: 'economy',
    rating: 4.9,
    isAvailable: true,
    latitude: 0.005,
    longitude: 0,
    note: 'closest economy, top rating',
  },
  {
    name: 'Hodan Ali',
    phone: '+15550001002',
    vehicleType: 'economy',
    rating: 4.5,
    isAvailable: true,
    latitude: 0.01,
    longitude: 0,
    note: 'second economy, good rating',
  },
  {
    name: 'Yusuf Hassan',
    phone: '+15550001003',
    vehicleType: 'comfort',
    rating: 4.7,
    isAvailable: true,
    latitude: 0.008,
    longitude: 0,
    note: 'close comfort',
  },
  {
    name: 'Sahra Abdi',
    phone: '+15550001004',
    vehicleType: 'xl',
    rating: 4.8,
    isAvailable: true,
    latitude: 0.012,
    longitude: 0,
    note: 'close xl',
  },
  {
    name: 'Bilal Omar',
    phone: '+15550001005',
    vehicleType: 'economy',
    rating: 5,
    isAvailable: true,
    latitude: 0.05,
    longitude: 0,
    note: 'farther economy, perfect rating',
  },
  {
    name: 'Maryan Yusuf',
    phone: '+15550001006',
    vehicleType: 'economy',
    rating: 4.6,
    isAvailable: true,
    latitude: 0.5,
    longitude: 0,
    note: 'too far for short waits or price caps',
  },
  {
    name: 'Ahmed Nur',
    phone: '+15550001007',
    vehicleType: 'economy',
    rating: 4.4,
    isAvailable: false,
    latitude: 0.006,
    longitude: 0,
    note: 'close but unavailable',
  },
  {
    name: 'Ilhan Aden',
    phone: '+15550001008',
    vehicleType: 'economy',
    rating: 4.2,
    isAvailable: true,
    latitude: 0.07,
    longitude: 0,
    note: 'near the maxWaitTime edge',
  },
  {
    name: 'Warsame Guled',
    phone: '+15550001009',
    vehicleType: 'comfort',
    rating: 4.3,
    isAvailable: true,
    latitude: 0.03,
    longitude: 0,
    note: 'mid-distance comfort',
  },
  {
    name: 'Deeqa Ismail',
    phone: '+15550001010',
    vehicleType: 'xl',
    rating: 3.9,
    isAvailable: true,
    latitude: 0.04,
    longitude: 0,
    note: 'mid-distance xl, lowest rating',
  },
];

async function removeExistingSeedAccounts(phones: string[]): Promise<number> {
  const db = getDb();
  const existing = await db
    .collection<UserDocument>(COLLECTIONS.users)
    .find({ phone: { $in: phones } })
    .toArray();

  if (existing.length === 0) {
    return 0;
  }

  const existingIds = existing.map((user) => user._id);
  await db
    .collection<DriverDocument>(COLLECTIONS.drivers)
    .deleteMany({ userId: { $in: existingIds } });
  await db.collection<UserDocument>(COLLECTIONS.users).deleteMany({ _id: { $in: existingIds } });

  return existing.length;
}

async function seed(): Promise<void> {
  const reset = process.argv.includes('--reset');

  await connectToDatabase();

  if (reset) {
    await getDb().dropDatabase();
    console.log('Database dropped (--reset)');
  }

  await ensureIndexes(getDb());

  const seedPhones = [PASSENGER.phone, ...DRIVERS.map((driver) => driver.phone)];
  const removed = await removeExistingSeedAccounts(seedPhones);
  if (removed > 0) {
    console.log(`Replaced ${removed} existing seed account(s)`);
  }

  await createUser({
    name: PASSENGER.name,
    phone: PASSENGER.phone,
    passwordHash: await bcrypt.hash(PASSENGER.password, PASSWORD_SALT_ROUNDS),
    role: 'passenger',
  });

  const driverPasswordHash = await bcrypt.hash(DRIVER_PASSWORD, PASSWORD_SALT_ROUNDS);

  for (const driver of DRIVERS) {
    const user = await createUser({
      name: driver.name,
      phone: driver.phone,
      passwordHash: driverPasswordHash,
      role: 'driver',
    });

    await createDriver({
      userId: user._id,
      vehicleType: driver.vehicleType,
      rating: driver.rating,
      isAvailable: driver.isAvailable,
      latitude: driver.latitude,
      longitude: driver.longitude,
    });
  }

  console.log('');
  console.log('Seed complete: 1 passenger + 10 drivers');
  console.log(`Passenger login: ${PASSENGER.phone} / ${PASSENGER.password}`);
  console.log(`Driver logins:   ${DRIVERS[0]?.phone}..${DRIVERS[DRIVERS.length - 1]?.phone} / ${DRIVER_PASSWORD}`);
  console.log('');
  console.log('Drivers relative to demo pickup (0, 0):');

  for (const driver of DRIVERS) {
    const distance = haversineDistanceKm(DEMO_PICKUP, {
      latitude: driver.latitude,
      longitude: driver.longitude,
    });
    const status = driver.isAvailable ? 'available' : 'unavailable';
    console.log(
      `  ${driver.phone}  ${driver.vehicleType.padEnd(7)} rating ${String(driver.rating).padEnd(3)} ${status.padEnd(11)} ~${distance.toFixed(2).padStart(6)} km  ETA ${String(estimateArrivalMinutes(distance)).padStart(5)} min  fare ${estimateFare(distance, driver.vehicleType).toFixed(2).padStart(6)}  ${driver.note}`,
    );
  }

  console.log('');
  console.log('Scenario hints (create rides with pickup 0,0 and destination 2,2):');
  console.log('  Multiple valid matches : preferredVehicleType economy, maxPrice 25, maxWaitTime 15');
  console.log('  No eligible drivers    : preferredVehicleType xl, maxPrice 25, maxWaitTime 1');
  console.log('  No eligible drivers    : preferredVehicleType comfort, maxPrice 2, maxWaitTime 30');
  console.log('  Human review           : start the backend with TYPE_SAFE_CONFIDENCE_THRESHOLD=1 and match a ride');

  await disconnectFromDatabase();
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});