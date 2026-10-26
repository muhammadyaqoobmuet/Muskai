import { ReelDetail } from '@/components/reels/ReelDetail';
import { Nav } from '@/components/site/Nav';

export const metadata = {
  title: 'Reel',
};

export default async function ReelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-[100dvh]">
      <Nav />
      <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8 sm:py-14">
        <ReelDetail id={id} />
      </div>
    </main>
  );
}
