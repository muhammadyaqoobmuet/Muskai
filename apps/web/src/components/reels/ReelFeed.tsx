'use client';

import { useQuery } from '@tanstack/react-query';
import { FilmStrip } from '@phosphor-icons/react';
import type { ReelDTO } from '@muskai/shared';
import { ReelCard } from '@/components/reels/ReelCard';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { api } from '@/lib/api';

/** The community feed: every published reel, newest first. */
export function ReelFeed({
  handle,
  limit = 24,
  emptyAction,
}: {
  handle?: string;
  limit?: number;
  emptyAction?: React.ReactNode;
}) {
  const query = useQuery({
    queryKey: ['reels', handle ?? 'all'],
    queryFn: () => api.listReels({ limit, handle }),
  });

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[9/16] w-full rounded-card" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState message="Could not load the feed. Is the API running on http://localhost:4000?" />
    );
  }

  const reels: ReelDTO[] = query.data ?? [];

  if (reels.length === 0) {
    return (
      <EmptyState
        icon={<FilmStrip size={28} />}
        title={handle ? 'No published reels yet' : 'Nothing published yet'}
        body={
          handle
            ? 'This creator has not shared a finished reel with the community.'
            : 'Reels appear here the moment a creator publishes one. Make the first.'
        }
        action={emptyAction}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} />
      ))}
    </div>
  );
}

/** Compact feed used on the landing page, so it never competes with the hero. */
export function ReelStrip() {
  const query = useQuery({
    queryKey: ['reels', 'all'],
    queryFn: () => api.listReels({ limit: 8 }),
  });

  const reels = query.data ?? [];
  if (reels.length === 0) return null;

  return (
    <div className="rail -mx-5 flex gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
      {reels.map((reel) => (
        <div key={reel.id} className="w-[168px] shrink-0 sm:w-[208px]">
          <ReelCard reel={reel} />
        </div>
      ))}
      <div className="flex w-[168px] shrink-0 items-center justify-center sm:w-[208px]">
        <ButtonLink href="/explore" variant="secondary" size="sm">
          See all reels
        </ButtonLink>
      </div>
    </div>
  );
}
