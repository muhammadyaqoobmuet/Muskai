import { Nav } from '@/components/site/Nav';
import { Skeleton } from '@/components/ui/EmptyState';

export default function Loading() {
  return (
    <main className="min-h-[100dvh]">
      <Nav />
      <div className="mx-auto max-w-[1100px] px-5 pt-14 pb-20 sm:px-8 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-16">
          <Skeleton className="aspect-[9/16] w-full rounded-card" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
