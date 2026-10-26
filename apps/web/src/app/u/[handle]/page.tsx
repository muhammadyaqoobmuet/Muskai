import { CreatorProfile } from '@/components/reels/CreatorProfile';
import { Nav } from '@/components/site/Nav';

export const metadata = {
  title: 'Creator',
};

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  return (
    <main className="min-h-[100dvh]">
      <Nav />
      <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        <CreatorProfile handle={handle} />
      </div>
    </main>
  );
}
