import { ObjectId } from 'mongodb';

import { AppError } from './AppError';

export function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new AppError(400, 'INVALID_ID', `Invalid identifier: ${id}`);
  }

  return new ObjectId(id);
}