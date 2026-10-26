import { Nav } from '@/components/site/Nav';
import { Skeleton } from '@/components/ui/EmptyState';

export default function Loading() {
  return (
    <main className="min-h-[100dvh]">
      <Nav />
      <div className="mx-auto max-w-[1200px] px-5 pt-14 pb-20 sm:px-8 sm:pt-20 sm:pb-24">
        <Skeleton className="h-12 w-72 max-w-full" />
        <Skeleton className="mt-4 h-6 w-96 max-w-full" />
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[9/16] w-full rounded-card" />
          ))}
        </div>
      </div>
    </main>
  );
}
