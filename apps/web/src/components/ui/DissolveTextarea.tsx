'use client';

import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { TEXTAREA_TEXT } from '@/components/ui/Field';

/**
 * A field that carries its value away once it is spent.
 *
 * The text does not blink out: it dissolves where it sits, and the field is
 * empty when the animation lands. The caller owns the value, so it decides
 * when a value is spent by flipping `spending`.
 *
 * Stand-in for the Kobra registry item of the same idea
 * (@kobra/input-dissolve), which sits behind a paid token.
 */
interface DissolveTextareaProps extends ComponentProps<'textarea'> {
  /** Set true to spend the current value. */
  spending?: boolean;
  /** Fired once the value has finished dissolving. */
  onSpent?: () => void;
  /** How long the dissolve takes, in ms. */
  duration?: number;
  /** Classes for the dissolving copy of the text. Must match the control. */
  textClassName?: string;
}

export function DissolveTextarea({
  spending = false,
  onSpent,
  duration = 480,
  textClassName = TEXTAREA_TEXT,
  value,
  className,
  ...rest
}: DissolveTextareaProps) {
  const [ghost, setGhost] = useState<string | null>(null);
  const wasSpending = useRef(false);

  useEffect(() => {
    if (!spending) {
      wasSpending.current = false;
      return;
    }
    if (wasSpending.current) return;
    wasSpending.current = true;

    const text = typeof value === 'string' ? value : '';
    if (!text) {
      onSpent?.();
      return;
    }
    setGhost(text);
  }, [spending, value, onSpent]);

  const settle = () => {
    setGhost(null);
    onSpent?.();
  };

  return (
    <div className="relative">
      <textarea {...rest} className={className} value={ghost ? '' : (value ?? '')} />
      {ghost ? (
        <div
          aria-hidden
          data-dissolving="true"
          onAnimationEnd={settle}
          style={{ animationDuration: `${duration}ms` }}
          className={`pointer-events-none absolute inset-0 z-10 whitespace-pre-wrap break-words text-ink-50 ${textClassName}`}
        >
          {ghost}
        </div>
      ) : null}
    </div>
  );
}
