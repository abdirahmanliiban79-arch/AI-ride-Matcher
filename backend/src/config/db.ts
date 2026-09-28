import { MongoClient, type Db } from 'mongodb';

import { env } from './env';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  db = client.db();

  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database connection has not been established');
  }

  return db;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (client) {
    await client.close();
  }

  client = null;
  db = null;
}