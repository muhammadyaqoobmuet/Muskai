'use client';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/** Pill segmented control. The thumb is paper, the track is canvas. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  fullWidth = false,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** Stretch evenly to the container width, e.g. inside a form column. */
  fullWidth?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`${fullWidth ? 'flex w-full' : 'inline-flex flex-wrap'} gap-1 rounded-pill bg-ink-950 p-1`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            title={option.hint}
            onClick={() => onChange(option.value)}
            className={`rounded-pill py-1.5 font-medium transition-[background-color,color,box-shadow] duration-200 ${
              fullWidth ? 'min-w-0 flex-1 px-1' : 'px-3.5'
            } text-[12px] ${
              active
                ? 'bg-white text-ink-100 shadow-sm'
                : 'text-ink-400 hover:text-ink-100'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
