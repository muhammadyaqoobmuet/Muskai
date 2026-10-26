import { ReelFeed } from '@/components/reels/ReelFeed';
import { Nav } from '@/components/site/Nav';

export const metadata = {
  title: 'Explore',
  description: 'Reels published by the Muskai community.',
};

export default function ExplorePage() {
  return (
    <main className="min-h-[100dvh]">
      <Nav />
      <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-2xl">
          <h1 className="text-[clamp(2.25rem,4.4vw,3.5rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-ink-100">
            The community feed
          </h1>
          <p className="mt-4 max-w-xl text-[19px] leading-[1.42] text-ink-400">
            Reels other creators published. Open one to watch it and leave a like.
          </p>
        </div>

        <div className="mt-12">
          <ReelFeed limit={30} />
        </div>
      </div>
    </main>
  );
}
