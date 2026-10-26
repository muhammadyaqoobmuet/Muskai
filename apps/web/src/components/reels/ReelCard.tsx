'use client';

import { Eye, Heart, Play } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { ReelDTO } from '@muskai/shared';
import { Avatar } from '@/components/ui/Avatar';
import { fileUrl } from '@/lib/api';

/**
 * A reel tile. The video only loads when the pointer arrives, so a feed of
 * forty reels costs one poster each until someone actually looks.
 */
export function ReelCard({ reel }: { reel: ReelDTO }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const poster = fileUrl(reel.posterUrl);
  const video = fileUrl(reel.outputUrl);

  return (
    <Link
      href={`/reel/${reel.id}`}
      onMouseEnter={() => {
        setHovered(true);
        void videoRef.current?.play().catch(() => undefined);
      }}
      onMouseLeave={() => {
        setHovered(false);
        const el = videoRef.current;
        if (el) {
          el.pause();
          el.currentTime = 0;
        }
      }}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="group relative block overflow-hidden rounded-card bg-white ring-1 ring-ink-700/70 transition-[box-shadow,ring-color] duration-300 ease-out-expo hover:ring-ink-100/30"
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-ink-950">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-ink-500">
            <Play size={30} weight="fill" />
          </div>
        )}

        {video ? (
          <video
            ref={videoRef}
            src={video}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              hovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="line-clamp-2 text-[13px] leading-snug font-medium text-white">
            {reel.prompt}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar name={reel.author.name} src={reel.author.avatarUrl} size={24} />
            <span className="min-w-0 flex-1 truncate text-[12px] text-white/80">
              {reel.author.name}
            </span>
            <span className="inline-flex items-center gap-1 text-[12px] text-white/80">
              <Heart size={13} weight={reel.likeCount > 0 ? 'fill' : 'regular'} />
              {reel.likeCount}
            </span>
            <span className="inline-flex items-center gap-1 text-[12px] text-white/80">
              <Eye size={13} />
              {reel.viewCount}
            </span>
          </div>
        </div>

        <div className="absolute top-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {reel.targetDurationSec}s
        </div>
      </div>
    </Link>
  );
}
