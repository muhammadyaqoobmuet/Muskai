import { ShowcaseVideo } from '@/components/marketing/ShowcaseVideo';
import { SHOWCASE } from '@/lib/showcase';

/**
 * The right half of the auth pages: one real reel, running, with the prompt
 * that made it. A new account should see the product before the form.
 */
export function AuthAside() {
  const reel = SHOWCASE[1];
  const thumbs = [SHOWCASE[0], SHOWCASE[2], SHOWCASE[4]];

  return (
    <aside className="relative hidden min-h-[100dvh] overflow-hidden bg-black lg:block">
      <div className="absolute inset-0">
        <ShowcaseVideo
          src={reel.src}
          poster={reel.poster}
          label={reel.label}
          eager
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30" />

      <div className="relative flex h-full flex-col justify-between p-12 text-white">
        <p className="text-[13px] font-medium tracking-wide text-white/70">Muskai Studio</p>

        <div>
          <p className="max-w-md text-[34px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance">
            Every reel here started as one sentence.
          </p>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/70">
            You write it. Muskai renders it, stitches it, and puts it in the feed.
          </p>

          <div className="mt-8 flex items-center gap-3">
            {thumbs.map((thumb) => (
              <span
                key={thumb.id}
                className="h-16 w-12 overflow-hidden rounded-[10px] ring-1 ring-white/25"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb.poster} alt="" className="h-full w-full object-cover" />
              </span>
            ))}
            <span className="ml-1 font-mono text-[11px] text-white/60">
              generated · {reel.meta}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
