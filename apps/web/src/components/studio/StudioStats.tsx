'use client';

import { CheckCircle, Eye, FilmStrip, Globe } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/EmptyState';
import { useGenerations } from '@/components/studio/useGenerations';

export function StudioStats() {
  const query = useGenerations();

  if (query.isLoading) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] bg-ink-700/60 ring-1 ring-ink-700/60 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 bg-white px-4 py-4 sm:px-5">
            <Skeleton className="h-8 w-8 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-5 w-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) return null;

  const generations = query.data ?? [];
  const stats = [
    { label: 'Reels', value: generations.length, icon: FilmStrip },
    {
      label: 'Ready',
      value: generations.filter((generation) => generation.status === 'SUCCEEDED').length,
      icon: CheckCircle,
    },
    {
      label: 'Published',
      value: generations.filter((generation) => generation.published).length,
      icon: Globe,
    },
    {
      label: 'Views',
      value: generations.reduce((total, generation) => total + generation.viewCount, 0),
      icon: Eye,
    },
  ];

  return (
    <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] bg-ink-700/60 ring-1 ring-ink-700/60 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3 bg-white px-4 py-4 sm:px-5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-ink-950 text-ink-500">
            <stat.icon size={16} />
          </span>
          <div className="min-w-0">
            <dt className="text-[12px] text-ink-500">{stat.label}</dt>
            <dd className="mt-0.5 text-[22px] leading-none font-semibold tracking-[-0.02em] text-ink-100">
              {stat.value.toLocaleString('en-US')}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
