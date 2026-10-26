'use client';

import { ArrowRight, FilmStrip } from '@phosphor-icons/react';
import Link from 'next/link';
import { JobCard } from '@/components/studio/JobCard';
import { useGenerations } from '@/components/studio/useGenerations';
import { ErrorState, Skeleton } from '@/components/ui/EmptyState';

/** The creator's own reels, newest first, polling only while work is live. */
export function JobList() {
  const query = useGenerations();
  const generations = query.data ?? [];

  return (
    <section className="overflow-hidden rounded-[16px] bg-white ring-1 ring-ink-700/70">
      <div className="flex items-center justify-between gap-3 border-b border-ink-700/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-ink-100">Recent reels</h2>
          {generations.length > 0 ? (
            <span className="rounded-full bg-ink-950 px-2 py-0.5 text-[11px] font-medium text-ink-500">
              {generations.length}
            </span>
          ) : null}
        </div>
        <Link
          href="/library"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-spark-text transition-colors duration-200 hover:text-spark"
        >
          Open library
          <ArrowRight size={12} weight="bold" />
        </Link>
      </div>

      {query.isLoading ? (
        <div className="divide-y divide-ink-700/60">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3.5 px-5 py-4">
              <Skeleton className="h-[72px] w-[54px] shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <div className="p-4">
          <ErrorState message="Could not reach the API. Is it running on http://localhost:4000?" />
        </div>
      ) : generations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink-950 text-ink-500">
            <FilmStrip size={21} />
          </span>
          <div>
            <p className="text-[15px] font-medium text-ink-100">No reels yet</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
              Write a prompt in the composer and your first render will land here.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-ink-700/60">
          {generations.map((generation) => (
            <JobCard key={generation.id} generation={generation} />
          ))}
        </div>
      )}
    </section>
  );
}
