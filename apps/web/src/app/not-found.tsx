import Link from 'next/link';
import { Footer } from '@/components/site/Footer';
import { Nav } from '@/components/site/Nav';

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] bg-white">
      <Nav />
      <section className="mx-auto flex min-h-[calc(100dvh-12rem)] max-w-[1200px] flex-col items-center justify-center px-5 py-24 text-center sm:px-8">
        <p className="text-[17px] leading-none font-medium text-ink-400">404</p>
        <h1 className="mt-5 max-w-2xl text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.04] font-semibold tracking-[-0.04em] text-balance text-ink-100">
          This page went off-frame.
        </h1>
        <p className="mt-5 max-w-md text-[19px] leading-[1.42] text-ink-400">
          The link is broken or the reel has been taken down. Nothing else is missing.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-pill bg-spark px-6 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-spark-soft"
          >
            Back to home
          </Link>
          <Link
            href="/explore"
            className="inline-flex h-11 items-center rounded-pill border border-ink-100/80 px-6 text-[15px] font-medium text-ink-100 transition-colors duration-200 hover:bg-ink-950"
          >
            Explore the feed
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
