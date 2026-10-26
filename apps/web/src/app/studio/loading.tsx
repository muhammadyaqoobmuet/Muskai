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
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          <Skeleton className="mt-6 h-[86px] w-full rounded-[16px]" />
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
            <Skeleton className="h-[560px] rounded-[16px]" />
            <div className="space-y-3">
              <Skeleton className="h-14 rounded-[16px]" />
              <Skeleton className="h-[300px] rounded-[16px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
