export const COLLECTIONS = {
  users: 'users',
  drivers: 'drivers',
  rides: 'rides',
  rideMatches: 'rideMatches',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];