import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { MODEL_REGISTRY } from '@muskai/shared';
import Link from 'next/link';
import { DemoPrompts } from '@/components/marketing/DemoPrompts';
import { Enter, Reveal } from '@/components/motion/Reveal';
import { HeroComposer } from '@/components/marketing/HeroComposer';
import { HeroShowcase } from '@/components/marketing/HeroShowcase';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { ModelFleet } from '@/components/marketing/ModelFleet';
import { ShowcaseVideo } from '@/components/marketing/ShowcaseVideo';
import { ReelStrip } from '@/components/reels/ReelFeed';
import { Footer } from '@/components/site/Footer';
import { Nav } from '@/components/site/Nav';
import { SHOWCASE } from '@/lib/showcase';

const SPECS = ['5 to 20 seconds', '9:16, 16:9, 1:1', 'Wan model family', 'MP4 download'];

export default function LandingPage() {
  return (
    <main className="bg-white">
      <div className="border-b border-ink-700 bg-white">
        <p className="mx-auto max-w-[1200px] px-5 py-2.5 text-center text-[12px] leading-snug text-ink-300 sm:px-8">
          Free-quota generation is open. Every reel you make is yours to keep.{' '}
          <Link
            href="/signup"
            className="text-spark-text hover:underline hover:underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </div>

      <Nav />

      {/* Hero: the product interaction, not a mock of it. */}
      <section className="mx-auto max-w-[1200px] px-5 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <Enter>
            <p className="text-[17px] leading-none font-medium text-ink-400">Muskai Studio</p>
          </Enter>

          <Enter delay={0.06}>
            <h1 className="mt-5 text-[clamp(2.75rem,7.4vw,6rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance text-ink-100">
              Your words.
              <br />
              A finished reel.
            </h1>
          </Enter>

          <Enter delay={0.12}>
            <p className="mx-auto mt-6 max-w-xl text-[19px] leading-[1.42] text-ink-400 sm:text-[21px]">
              One sentence becomes a vertical reel, rendered by the Wan model family and stitched
              into a single take. No timeline, no keyframes.
            </p>
          </Enter>
        </div>

        <Enter delay={0.18} className="mx-auto mt-10 max-w-2xl">
          <HeroComposer />
        </Enter>

        <Enter delay={0.24}>
          <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[12px] text-ink-500">
            {SPECS.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
        </Enter>
      </section>

      {/* The output. Real reels, running. */}
      <section className="mx-auto max-w-[1200px] px-5 pb-20 sm:px-8 sm:pb-28">
        <Reveal>
          <HeroShowcase />
          <div className="mt-8 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-[14px] text-ink-400">
              Made with Muskai. Every frame generated from the prompt above it.
            </p>
            <Link
              href="/explore"
              className="group inline-flex items-center gap-1 py-2 text-[14px] text-spark-text hover:underline hover:underline-offset-4"
            >
              Explore the feed
              <ArrowRight
                size={14}
                weight="bold"
                className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Community band. */}
      <section className="bg-ink-950 py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[17px] leading-none font-medium text-ink-400">Community</p>
                <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-ink-100">
                  Fresh from the feed.
                </h2>
              </div>
              <Link
                href="/explore"
                className="group inline-flex items-center gap-1 py-2 text-[14px] text-spark-text hover:underline hover:underline-offset-4"
              >
                See every reel
                <ArrowRight
                  size={14}
                  weight="bold"
                  className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="mt-10">
            <ReelStrip />
          </Reveal>
        </div>
      </section>

      {/* Engines. */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <p className="text-[17px] leading-none font-medium text-ink-400">Engines</p>
          <h2 className="mt-3 max-w-2xl text-[clamp(2rem,4vw,3.25rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-ink-100">
            {MODEL_REGISTRY.length} models. One queue.
          </h2>
          <p className="mt-5 max-w-xl text-[17px] leading-[1.47] text-ink-400">
            Each engine has its own free pool. When one runs dry the router moves to the next in
            the chain, so a job never dies halfway through.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-12">
          <ModelFleet />
        </Reveal>
      </section>

      {/* Continuity feature. */}
      <section className="bg-ink-950 py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[28px] bg-black lg:mx-0">
              <div className="relative aspect-[9/16] w-full">
                <ShowcaseVideo
                  src={SHOWCASE[3].src}
                  poster={SHOWCASE[3].poster}
                  label={SHOWCASE[3].label}
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="text-[17px] leading-none font-medium text-ink-400">Continuity</p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-ink-100">
              Twenty seconds.
              <br />
              Still one shot.
            </h2>
            <p className="mt-5 max-w-md text-[17px] leading-[1.47] text-ink-400">
              Longer reels are built segment by segment. Each one continues from the last frame of
              the one before it, then the stitcher joins them into a single file.
            </p>
            <Link
              href="/studio"
              className="mt-8 inline-flex h-11 items-center rounded-pill bg-spark px-6 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-spark-soft"
            >
              Try a long take
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Process. */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <p className="text-[17px] leading-none font-medium text-ink-400">How it works</p>
          <h2 className="mt-3 max-w-2xl text-[clamp(2rem,4vw,3.25rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-ink-100">
            Three steps, about a minute.
          </h2>
        </Reveal>

        <div className="mt-14">
          <HowItWorks />
        </div>
      </section>

      {/* Prompt starters. */}
      <section className="bg-ink-950 py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <Reveal>
            <p className="text-[17px] leading-none font-medium text-ink-400">Prompts</p>
            <h2 className="mt-3 max-w-2xl text-[clamp(2rem,4vw,3.25rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-ink-100">
              Start with an idea that already works.
            </h2>
            <p className="mt-5 max-w-xl text-[17px] leading-[1.47] text-ink-400">
              Pick one and it loads into the composer above, ready to change or send as it is.
            </p>
          </Reveal>

          <Reveal delay={0.08} className="mt-12">
            <DemoPrompts />
          </Reveal>
        </div>
      </section>

      {/* Closing call. */}
      <section className="mx-auto max-w-[1200px] px-5 py-24 text-center sm:px-8 sm:py-32">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-[clamp(2.25rem,5.4vw,4.25rem)] leading-[1.03] font-semibold tracking-[-0.04em] text-balance text-ink-100">
            Your next reel is one sentence away.
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/studio"
              className="inline-flex h-12 items-center rounded-pill bg-spark px-7 text-[17px] font-medium text-white transition-colors duration-200 hover:bg-spark-soft"
            >
              Create a reel
            </Link>
            <Link
              href="/explore"
              className="inline-flex h-12 items-center rounded-pill border border-ink-100/80 px-7 text-[17px] font-medium text-ink-100 transition-colors duration-200 hover:bg-ink-950"
            >
              Explore the feed
            </Link>
          </div>
          <p className="mt-5 text-[13px] text-ink-500">Free to try. No card required.</p>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
