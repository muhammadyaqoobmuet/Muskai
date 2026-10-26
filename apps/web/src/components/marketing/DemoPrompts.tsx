'use client';

import { ArrowUpRight } from '@phosphor-icons/react';
import { DEMO_PROMPTS } from '@/lib/showcase';
import { handOffPrompt } from '@/lib/prompt-handoff';

/** Prompt starters that fill the hero composer in one click. */
export function DemoPrompts() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {DEMO_PROMPTS.map((demo) => (
        <article
          key={demo.title}
          className="flex gap-4 rounded-card bg-white p-3 transition-colors duration-200 hover:bg-[#fbfbfd]"
        >
          <div className="h-[112px] w-[84px] shrink-0 overflow-hidden rounded-[14px] bg-ink-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={demo.poster} alt="" className="h-full w-full object-cover" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="text-[17px] leading-tight font-semibold text-ink-100">{demo.title}</h3>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-400">
              {demo.body}
            </p>
            <button
              type="button"
              onClick={() => handOffPrompt(demo.prompt)}
              className="group mt-auto inline-flex w-fit items-center gap-1 pt-2 text-[13px] text-spark-text hover:underline hover:underline-offset-4"
            >
              Use this prompt
              <ArrowUpRight
                size={13}
                weight="bold"
                className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
