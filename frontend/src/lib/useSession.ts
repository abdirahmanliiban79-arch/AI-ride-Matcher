'use client';

import { useMemo, useSyncExternalStore } from 'react';

import { getSessionRaw, subscribeToSession, type StoredSession } from './session';
import { useHydrated } from './useHydrated';

function parseSession(raw: string | null): StoredSession | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed.token === 'string' && parsed.user) {
      return parsed as StoredSession;
    }

    return null;
  } catch {
    return null;
  }
}

export function useSession(): { session: StoredSession | null; ready: boolean } {
  const hydrated = useHydrated();
  const raw = useSyncExternalStore(subscribeToSession, getSessionRaw, () => null);
  const session = useMemo(() => parseSession(raw), [raw]);

  return { session, ready: hydrated };
}