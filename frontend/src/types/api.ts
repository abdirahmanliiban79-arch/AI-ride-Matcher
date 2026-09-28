export type UserRole = 'passenger' | 'driver';

export type User = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type VehicleType = 'economy' | 'comfort' | 'xl';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type RideStatus =
  | 'REQUESTED'
  | 'MATCHING'
  | 'MATCHED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type RideDriverSummary = {
  id: string;
  name: string;
  vehicleType: VehicleType;
  rating: number;
};

export type Ride = {
  id: string;
  passengerId: string;
  pickup: Coordinate;
  destination: Coordinate;
  maxPrice: number;
  preferredVehicleType: VehicleType;
  maxWaitTime: number;
  status: RideStatus;
  assignedDriverId: string | null;
  driver: RideDriverSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type MatchType = 'best_match' | 'no_match' | 'human_review';

export type RideMatch = {
  matchType: MatchType;
  confidence: number;
  driverId: string | null;
};

export type MatchOutcome = {
  ride: Ride;
  match: RideMatch;
};

export type DriverProfile = {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  rating: number;
  isAvailable: boolean;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
};