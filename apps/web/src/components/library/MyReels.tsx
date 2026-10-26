'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, FilmStrip, PaperPlaneTilt } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';
import type { GenerationDTO } from '@muskai/shared';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { fileUrl } from '@/lib/api';
import { api, ApiError } from '@/lib/api';

type Filter = 'all' | 'published' | 'drafts';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'drafts', label: 'Drafts' },
];

export function MyReels() {
  const [filter, setFilter] = useState<Filter>('all');

  const query = useQuery({
    queryKey: ['generations'],
    queryFn: api.listGenerations,
    refetchInterval: (q) =>
      (q.state.data ?? []).some((g) =>
        ['QUEUED', 'RUNNING', 'STITCHING'].includes(g.status),
      )
        ? 2_000
        : false,
  });

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[9/16] w-full rounded-card" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState message="Could not reach the API. Is it running on http://localhost:4000?" />
    );
  }

  const all = query.data ?? [];
  const reels = all.filter((g) =>
    filter === 'published' ? g.published : filter === 'drafts' ? !g.published : true,
  );

  return (
    <div>
      <div className="mb-8 inline-flex gap-1 rounded-pill bg-ink-950 p-1">
        {FILTERS.map((option) => {
          const active = option.value === filter;
          const count =
            option.value === 'all'
              ? all.length
              : all.filter((g) => (option.value === 'published' ? g.published : !g.published))
                  .length;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(option.value)}
              className={`rounded-pill px-4 py-1.5 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200 ${
                active ? 'bg-white text-ink-100 shadow-sm' : 'text-ink-400 hover:text-ink-100'
              }`}
            >
              {option.label}
              <span className="ml-1.5 font-mono text-[11px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {reels.length === 0 ? (
        <EmptyState
          icon={<FilmStrip size={28} />}
          title={filter === 'all' ? 'Your library is empty' : 'Nothing here yet'}
          body={
            filter === 'all'
              ? 'Every reel you generate shows up here, ready to publish.'
              : filter === 'published'
                ? 'Publish a finished reel and it lands in the community feed.'
                : 'Reels you have not published yet stay private to you.'
          }
          action={
            <ButtonLink href="/studio" variant="secondary" size="sm">
              Open the Studio
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {reels.map((reel) => (
            <LibraryTile key={reel.id} reel={reel} />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryTile({ reel }: { reel: GenerationDTO }) {
  const poster = fileUrl(reel.posterUrl);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const publishable = reel.status === 'SUCCEEDED';

  const publish = useMutation({
    mutationFn: (published: boolean) => api.publishGeneration(reel.id, published),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['generations'] });
      void queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not update this reel'),
  });

  return (
    <article className="group flex flex-col overflow-hidden rounded-card bg-white ring-1 ring-ink-700/70 transition-[box-shadow,ring-color] duration-300 ease-out-expo hover:ring-ink-100/30">
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-ink-850">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-600">
            <FilmStrip size={22} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
          <p className="line-clamp-2 text-[12px] leading-snug text-white">{reel.prompt}</p>
        </div>
        {reel.published ? (
          <span className="absolute top-3 left-3 rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
            Live
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <StatusChip status={reel.status} />
        <span className="font-mono text-[11px] text-ink-500">{reel.targetDurationSec}s</span>
      </div>

      {publishable ? (
        <div className="mt-auto border-t border-ink-700/70 px-3 py-2.5">
          {reel.published ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
              <Link
                href={`/reel/${reel.id}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-control px-2 py-2 text-[12px] font-medium text-ink-300 transition-colors duration-200 hover:bg-ink-950 hover:text-ink-100"
              >
                <Eye size={14} />
                View in feed
              </Link>
              <button
                type="button"
                onClick={() => publish.mutate(false)}
                disabled={publish.isPending}
                className="rounded-control px-2 py-2 text-[12px] text-ink-500 transition-colors duration-200 hover:bg-ink-950 hover:text-ink-100 disabled:opacity-50"
              >
                Unpublish
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => publish.mutate(true)}
              disabled={publish.isPending}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-pill bg-spark px-3 py-2 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-spark-soft disabled:opacity-50"
            >
              <PaperPlaneTilt size={14} weight="fill" />
              {publish.isPending ? 'Publishing' : 'Publish to feed'}
            </button>
          )}
          {error ? <p className="mt-2 text-[12px] text-danger">{error}</p> : null}
        </div>
      ) : null}
    </article>
  );
}
