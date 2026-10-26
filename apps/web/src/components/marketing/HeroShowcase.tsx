import { ShowcaseVideo } from '@/components/marketing/ShowcaseVideo';
import { HERO_REELS } from '@/lib/showcase';

/**
 * Real generated reels, framed like product shots. The center reel plays
 * eagerly; the flanking ones start when they scroll into view.
 */
export function HeroShowcase() {
  return (
    <div className="rail -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0">
      {HERO_REELS.map((reel, index) => {
        const center = index === 1;
        return (
          <figure
            key={reel.id}
            className="w-[44vw] shrink-0 snap-start sm:w-auto"
          >
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[24px] bg-black">
              <ShowcaseVideo
                src={reel.src}
                poster={reel.poster}
                label={reel.label}
                eager={center}
              />
              <span className="absolute top-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {reel.meta}
              </span>
            </div>
            <figcaption className="mt-3 line-clamp-2 px-1 text-[13px] leading-snug text-ink-400">
              {reel.label}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
