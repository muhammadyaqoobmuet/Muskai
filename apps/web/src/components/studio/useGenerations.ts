'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const ACTIVE = new Set(['QUEUED', 'RUNNING', 'STITCHING']);

/** Shared generations query: polls only while something is rendering. */
export function useGenerations() {
  return useQuery({
    queryKey: ['generations'],
    queryFn: api.listGenerations,
    refetchInterval: (query) =>
      (query.state.data ?? []).some((generation) => ACTIVE.has(generation.status))
        ? 2_000
        : false,
  });
}
