import type { ReactNode } from 'react';

/** Small status pill. Monochrome by default; blue only for live work. */

type Tone = 'neutral' | 'live' | 'ready' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-950 text-ink-400',
  live: 'bg-spark/10 text-spark-text',
  ready: 'bg-ink-950 text-ink-100',
  danger: 'bg-danger-soft text-danger',
};

export function Chip({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[12px] font-medium whitespace-nowrap ${TONES[tone]} ${className ?? ''}`}
    >
      {children}
    </span>
  );
}

/** A pulsing dot for live work. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`relative flex h-1.5 w-1.5 ${className ?? ''}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spark opacity-60" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-spark" />
    </span>
  );
}
