import { Skeleton } from '@/components/ui/EmptyState';

export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-ink-950">
      <div className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-ink-700/70 bg-white px-4 pt-5 lg:flex">
        <Skeleton className="h-8 w-32" />
        <div className="mt-9 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>

      <div className="lg:pl-[248px]">
        <div className="flex h-14 items-center border-b border-ink-700/70 bg-white/85 px-5">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="mx-auto w-full max-w-[1240px] px-5 py-7 sm:px-8 sm:py-9">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
          <Skeleton className="mt-6 h-8 w-56 rounded-full" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[9/16] w-full rounded-[16px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
