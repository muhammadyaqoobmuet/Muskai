'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useSession } from '@/components/session/SessionProvider';
import { ErrorState } from '@/components/ui/EmptyState';

/**
 * Client-side half of the route guard. The middleware turns away a request
 * with no session cookie before the page renders. This catches the other
 * case: a cookie the API no longer accepts.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, error } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !error) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, error, router, pathname]);

  if (error) {
    return (
      <ErrorState message="Could not reach the API. Is it running on http://localhost:4000?" />
    );
  }

  if (loading || !user) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  return <>{children}</>;
}
