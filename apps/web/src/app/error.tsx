'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/** The last line of defence: a broken render still lands on a real page. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-white px-5 text-center">
      <div className="max-w-md">
        <p className="text-[17px] leading-none font-medium text-ink-400">Something broke</p>
        <h1 className="mt-4 text-[40px] leading-[1.06] font-semibold tracking-[-0.035em] text-ink-100">
          That did not render.
        </h1>
        <p className="mt-4 text-[17px] leading-[1.42] text-ink-400">
          The page hit an unexpected error. Try again, or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center rounded-pill bg-spark px-6 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-spark-soft"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-pill border border-ink-100/80 px-6 text-[15px] font-medium text-ink-100 transition-colors duration-200 hover:bg-ink-950"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
