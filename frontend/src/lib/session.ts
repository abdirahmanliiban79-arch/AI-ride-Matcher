import type { User } from '@/types/api';

const SESSION_KEY = 'airm.session';
const LAST_RIDE_KEY = 'airm.lastRideId';

export type StoredSession = {
  token: string;
  user: User;
};

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function getSessionRaw(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(SESSION_KEY);
}

export function setSession(session: StoredSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emit();
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
  emit();
}

export function getLastRideId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(LAST_RIDE_KEY);
}

export function setLastRideId(rideId: string): void {
  window.localStorage.setItem(LAST_RIDE_KEY, rideId);
}