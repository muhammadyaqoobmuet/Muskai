'use client';

import { useEffect, useRef } from 'react';

/**
 * A reel that only plays while it is on screen. Muted and inline, so it
 * behaves like a moving poster rather than a video player.
 */
export function ShowcaseVideo({
  src,
  poster,
  label,
  className = '',
  eager = false,
}: {
  src: string;
  poster: string;
  label: string;
  className?: string;
  eager?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      aria-label={label}
      muted
      loop
      playsInline
      preload={eager ? 'auto' : 'metadata'}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
