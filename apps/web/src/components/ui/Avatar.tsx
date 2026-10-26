import type { ReactNode } from 'react';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Deterministic hue per name so the fallback avatar is stable across renders. */
function hue(seed: string): number {
  let acc = 7;
  for (const ch of seed) acc = (acc * 31 + ch.charCodeAt(0)) >>> 0;
  return acc % 360;
}

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      // The API serves avatars as inline SVG data URIs, so next/image would
      // only add a round trip.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className ?? ''}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const h = hue(name);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(140deg, hsl(${h} 26% 62%), hsl(${(h + 42) % 360} 22% 40%))`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarBadge({
  name,
  src,
  children,
}: {
  name: string;
  src?: string | null;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Avatar name={name} src={src} size={32} />
      <span className="min-w-0">{children}</span>
    </span>
  );
}
