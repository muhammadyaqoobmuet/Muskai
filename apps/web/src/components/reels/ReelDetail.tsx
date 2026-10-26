'use client';

import { useQuery } from '@tanstack/react-query';
import { DownloadSimple, Eye, FilmStrip } from '@phosphor-icons/react';
import Link from 'next/link';
import { LikeButton } from '@/components/reels/LikeButton';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState, Skeleton } from '@/components/ui/EmptyState';
import { fileUrl } from '@/lib/api';
import { api } from '@/lib/api';

export function ReelDetail({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ['reel', id],
    queryFn: () => api.getReel(id),
  });

  if (query.isLoading) {
    return (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-16">
        <Skeleton className="aspect-[9/16] w-full rounded-card" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState message="That reel is not available. It may be private, or the link is wrong." />
    );
  }

  const reel = query.data;
  const video = fileUrl(reel.outputUrl);
  const poster = fileUrl(reel.posterUrl);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-16">
      <div>
        <div className="overflow-hidden rounded-[28px] bg-black">
          <div className="relative aspect-[9/16] w-full">
            {video ? (
              <video
                controls
                autoPlay
                loop
                playsInline
                preload="metadata"
                poster={poster ?? undefined}
                src={video}
                className="h-full w-full object-contain"
              />
            ) : poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt={reel.prompt} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-ink-500">
                <FilmStrip size={28} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <Link
          href={`/u/${reel.author.handle}`}
          className="-mx-3 inline-flex w-fit items-center gap-3 rounded-full px-3 py-1.5 transition-colors duration-200 hover:bg-ink-950"
        >
          <Avatar name={reel.author.name} src={reel.author.avatarUrl} size={40} />
          <span>
            <span className="block text-[15px] font-medium text-ink-100">{reel.author.name}</span>
            <span className="block text-[13px] text-ink-400">@{reel.author.handle}</span>
          </span>
        </Link>

        <h1 className="mt-8 text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-balance text-ink-100">
          {reel.prompt}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <LikeButton
            reelId={reel.id}
            initialLiked={reel.likedByMe}
            initialCount={reel.likeCount}
          />
          <span className="inline-flex items-center gap-2 px-3 py-2 text-[14px] text-ink-400">
            <Eye size={17} />
            <span className="tabular-nums">{reel.viewCount}</span>
          </span>
          {video ? (
            <a
              href={video}
              download
              className="inline-flex items-center gap-2 rounded-pill border border-ink-100/70 px-4 py-2 text-[14px] text-ink-100 transition-colors duration-200 hover:bg-ink-950"
            >
              <DownloadSimple size={15} />
              Download MP4
            </a>
          ) : null}
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-ink-700 pt-8 sm:grid-cols-3">
          <Meta label="Shape" value={reel.aspectRatio} />
          <Meta label="Length" value={`${reel.targetDurationSec}s`} />
          <Meta label="Engine" value={reel.modelsUsed[0] ?? 'auto'} />
          <Meta
            label="Published"
            value={new Date(reel.publishedAt ?? reel.createdAt).toLocaleDateString()}
          />
          <Meta label="Likes" value={String(reel.likeCount)} />
          <Meta label="Views" value={String(reel.viewCount)} />
        </dl>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-ink-500">{label}</dt>
      <dd className="mt-1 truncate text-[14px] text-ink-100">{value}</dd>
    </div>
  );
}
