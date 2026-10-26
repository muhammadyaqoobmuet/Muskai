'use client';

import { useQuery } from '@tanstack/react-query';
import { FilmStrip } from '@phosphor-icons/react';
import { ReelFeed } from '@/components/reels/ReelFeed';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState, Skeleton } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';

export function CreatorProfile({ handle }: { handle: string }) {
  const query = useQuery({
    queryKey: ['profile', handle],
    queryFn: () => api.getProfile(handle),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-10">
        <Skeleton className="h-28 w-full max-w-md rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <ErrorState message="No creator with that handle." />;
  }

  const profile = query.data;

  return (
    <div>
      <header className="flex flex-wrap items-center gap-5">
        <Avatar name={profile.name} src={profile.avatarUrl} size={72} />
        <div className="min-w-0">
          <h1 className="text-[28px] leading-none font-semibold tracking-[-0.035em] text-ink-50">
            {profile.name}
          </h1>
          <p className="mt-2 font-mono text-[13px] text-ink-400">@{profile.handle}</p>
        </div>

        <dl className="ml-auto flex gap-8">
          <Stat label="Reels" value={profile.reelCount} />
          <Stat label="Likes" value={profile.totalLikes} />
        </dl>
      </header>

      {profile.bio ? (
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-300">{profile.bio}</p>
      ) : null}

      <div className="mt-12">
        {profile.reelCount === 0 ? (
          <div className="flex items-center gap-3 rounded-card border border-dashed border-ink-700 px-6 py-14 text-ink-400">
            <FilmStrip size={24} />
            <p className="text-[15px]">This creator has not published a reel yet.</p>
          </div>
        ) : (
          <ReelFeed handle={handle} limit={24} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <dt className="text-[12px] text-ink-500">{label}</dt>
      <dd className="mt-1 font-mono text-xl tabular-nums text-ink-50">{value}</dd>
    </div>
  );
}
