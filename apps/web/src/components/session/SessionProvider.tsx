'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserDTO } from '@muskai/shared';
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { api } from '@/lib/api';

interface SessionValue {
  user: UserDTO | null;
  /** True while the first session check is still in flight. */
  loading: boolean;
  /** True when the session check itself failed (the API is unreachable). */
  error: boolean;
  login: (email: string, password: string) => Promise<UserDTO>;
  register: (name: string, email: string, password: string) => Promise<UserDTO>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['session'],
    queryFn: api.me,
    retry: false,
    staleTime: 60_000,
  });

  const user = data?.user ?? null;

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: next } = await api.login({ email, password });
      queryClient.setQueryData(['session'], { user: next });
      return next;
    },
    [queryClient],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: next } = await api.register({ name, email, password });
      queryClient.setQueryData(['session'], { user: next });
      return next;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await api.logout();
    queryClient.setQueryData(['session'], { user: null });
    queryClient.removeQueries({ queryKey: ['generations'] });
    queryClient.removeQueries({ queryKey: ['reels'] });
  }, [queryClient]);

  const value = useMemo<SessionValue>(
    () => ({ user, loading: isLoading, error: isError, login, register, logout }),
    [user, isLoading, isError, login, register, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
