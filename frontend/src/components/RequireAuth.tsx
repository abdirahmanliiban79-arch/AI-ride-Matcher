'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useSession } from '@/lib/useSession';
import type { StoredSession } from '@/lib/session';
import type { UserRole } from '@/types/api';

type RequireAuthProps = {
  children: (session: StoredSession) => ReactNode;
  role?: UserRole;
};

export function RequireAuth({ children, role }: RequireAuthProps) {
  const { session, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.replace('/login');
      return;
    }

    if (role && session.user.role !== role) {
      router.replace(session.user.role === 'driver' ? '/driver' : '/dashboard');
    }
  }, [ready, session, role, router]);

  if (!ready || !session || (role && session.user.role !== role)) {
    return <p className="muted">Loading…</p>;
  }

  return <>{children(session)}</>;
}