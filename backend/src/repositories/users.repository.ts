import { ObjectId } from 'mongodb';

import { COLLECTIONS } from '../config/collections';
import { getDb } from '../config/db';
import type { UserDocument } from '../types/user.types';
import { toObjectId } from '../utils/objectId';

export type CreateUserInput = Omit<UserDocument, '_id' | 'createdAt' | 'updatedAt'>;

export async function createUser(input: CreateUserInput): Promise<UserDocument> {
  const now = new Date();
  const doc: UserDocument = { _id: new ObjectId(), ...input, createdAt: now, updatedAt: now };

  await getDb().collection<UserDocument>(COLLECTIONS.users).insertOne(doc);

  return doc;
}

export async function findUserById(id: string): Promise<UserDocument | null> {
  return getDb().collection<UserDocument>(COLLECTIONS.users).findOne({ _id: toObjectId(id) });
}

export async function findUserByPhone(phone: string): Promise<UserDocument | null> {
  return getDb().collection<UserDocument>(COLLECTIONS.users).findOne({ phone });
}