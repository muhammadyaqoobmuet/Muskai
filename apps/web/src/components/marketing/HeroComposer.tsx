'use client';

import { ArrowUpRight, CaretDown } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ASPECT_RATIOS, GENERATION_MODES, MODE_LABELS } from '@muskai/shared';
import { DissolveTextarea } from '@/components/ui/DissolveTextarea';
import { onPromptHandoff } from '@/lib/prompt-handoff';
import { PROMPT_STARTERS } from '@/lib/showcase';

const PROMPT_TEXT = 'px-4 pt-3.5 pb-2 text-[17px] leading-relaxed';

/**
 * The hero prompt box. It is the real product interaction: type or pick a
 * starter, choose a shape, and it hands you to the Studio with the prompt
 * intact.
 */
export function HeroComposer() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<string>('TEXT_TO_VIDEO');
  const [aspect, setAspect] = useState<string>('9:16');
  const [open, setOpen] = useState(false);
  const [spending, setSpending] = useState(false);
  const handover = useRef<{ mode: string; aspect: string; prompt: string } | null>(null);

  useEffect(
    () =>
      onPromptHandoff((text) => {
        setPrompt(text);
        setSpending(false);
        setOpen(false);
        requestAnimationFrame(() => {
          const field = document.getElementById('hero-prompt');
          field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          field?.focus({ preventScroll: true });
        });
      }),
    [],
  );

  const submit = () => {
    const text = prompt.trim();
    if (!text) return;
    handover.current = { mode, aspect, prompt: text };
    setSpending(true);
  };

  const arrive = () => {
    const target = handover.current;
    handover.current = null;
    setSpending(false);
    setPrompt('');
    if (!target) return;
    const params = new URLSearchParams({
      mode: target.mode,
      aspect: target.aspect,
      prompt: target.prompt,
    });
    router.push(`/studio?${params.toString()}`);
  };

  return (
    <div>
      <div className="rounded-card bg-ink-950 p-2">
        <div className="rounded-[22px] bg-white ring-1 ring-ink-700/70 transition-[box-shadow] duration-200 focus-within:ring-2 focus-within:ring-spark">
          <DissolveTextarea
            id="hero-prompt"
            rows={2}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submit();
            }}
            placeholder="A paper boat drifting down a rain gutter at dusk"
            aria-label="Describe your reel"
            className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[17px] leading-relaxed text-ink-100 placeholder:text-ink-500 focus:outline-none"
            textClassName={PROMPT_TEXT}
            duration={280}
            spending={spending}
            onSpent={arrive}
          />

          <div className="flex items-center gap-1 border-t border-ink-700/60 px-2 py-1.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="listbox"
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-ink-400 transition-colors duration-200 hover:bg-ink-950 hover:text-ink-100"
              >
                {MODE_LABELS[mode as keyof typeof MODE_LABELS] ?? 'Text to Video'}
                <CaretDown
                  size={11}
                  weight="bold"
                  className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
              </button>

              {open ? (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    tabIndex={-1}
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <ul
                    role="listbox"
                    className="absolute bottom-full left-0 z-20 mb-2 w-56 overflow-hidden rounded-card border border-ink-700 bg-white p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
                  >
                    {GENERATION_MODES.map((option) => (
                      <li key={option}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={option === mode}
                          onClick={() => {
                            setMode(option);
                            setOpen(false);
                          }}
                          className={`w-full rounded-control px-3 py-2 text-left text-[13px] transition-colors duration-150 ${
                            option === mode
                              ? 'bg-ink-950 font-medium text-ink-100'
                              : 'text-ink-400 hover:bg-ink-950 hover:text-ink-100'
                          }`}
                        >
                          {MODE_LABELS[option]}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>

            <div className="hidden items-center gap-0.5 sm:flex">
              {ASPECT_RATIOS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAspect(option)}
                  aria-pressed={aspect === option}
                  className={`h-8 rounded-full px-2.5 text-[12px] transition-colors duration-200 ${
                    aspect === option
                      ? 'bg-ink-950 font-medium text-ink-100'
                      : 'text-ink-500 hover:text-ink-100'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={submit}
              aria-label="Create this reel"
              className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-spark text-white transition-[background-color,transform] duration-200 hover:bg-spark-soft active:scale-95"
            >
              <ArrowUpRight size={17} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-[12px] text-ink-500">Try</span>
        {PROMPT_STARTERS.slice(0, 3).map((starter) => (
          <button
            key={starter.label}
            type="button"
            title={starter.prompt}
            onClick={() => {
              setPrompt(starter.prompt);
              document.getElementById('hero-prompt')?.focus();
            }}
            className="rounded-full border border-ink-700 px-3 py-1.5 text-[12px] text-ink-400 transition-colors duration-200 hover:border-ink-100 hover:text-ink-100"
          >
            {starter.label}
          </button>
        ))}
      </div>

      <p className="mt-2.5 text-center text-[12px] text-ink-500">
        Press ⌘ + Enter to open it in the Studio
      </p>
    </div>
  );
}
