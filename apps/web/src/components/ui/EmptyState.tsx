import type { ReactNode } from 'react';

/** Empty and error states, composed rather than shouted. */

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-card bg-ink-950 px-6 py-20 text-center">
      {icon ? <div className="text-ink-500">{icon}</div> : null}
      <div className="max-w-md space-y-2">
        <h3 className="text-[21px] leading-tight font-semibold text-ink-100">{title}</h3>
        <p className="text-[15px] leading-relaxed text-ink-400">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-control border border-danger/20 bg-danger-soft px-5 py-4"
    >
      <p className="text-[14px] text-danger">{message}</p>
      {action}
    </div>
  );
}

/** Skeleton blocks shaped like the content they stand in for. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-control ${className}`} aria-hidden="true" />;
}
