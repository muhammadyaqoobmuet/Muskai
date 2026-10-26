import type { ComponentProps, ReactNode } from 'react';

/** Label above, control below, error underneath. Never a placeholder-as-label. */

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink-100">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[13px] leading-relaxed text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

export const CONTROL =
  'w-full rounded-control border border-ink-700 bg-white px-4 text-[16px] text-ink-100 ' +
  'placeholder:text-ink-500 transition-[border-color,box-shadow,background-color] duration-200 ' +
  'hover:border-ink-600 focus:border-spark focus:outline-none ' +
  'focus:ring-4 focus:ring-spark/15 disabled:bg-ink-950 disabled:text-ink-500';

/** Text layer metrics. The dissolve copy of the text has to match these exactly. */
export const TEXTAREA_TEXT = 'px-4 py-3 text-[16px] leading-relaxed';

export function textareaStyles(extra?: string) {
  return `${CONTROL} resize-none ${TEXTAREA_TEXT} ${extra ?? ''}`;
}

export function Input({ className, ...rest }: ComponentProps<'input'>) {
  return <input className={`${CONTROL} h-12 ${className ?? ''}`} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<'textarea'>) {
  return <textarea className={textareaStyles(className)} {...rest} />;
}

export function Select({ className, ...rest }: ComponentProps<'select'>) {
  return (
    <select
      className={`${CONTROL} h-12 appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10 ${className ?? ''}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 256 256'%3E%3Cpath fill='%236e6e73' d='M213.7 101.7l-80 80a8.2 8.2 0 0 1-11.4 0l-80-80a8.2 8.2 0 1 1 11.4-11.4L128 164.7l74.3-74.4a8.2 8.2 0 0 1 11.4 11.4Z'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    />
  );
}
