'use client';

import {
  DownloadSimple,
  Globe,
  GlobeHemisphereWest,
  Play,
  Plus,
  Trash,
  X,
} from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GenerationDTO } from '@muskai/shared';
import { useRef, useState, type ReactNode } from 'react';
import { StatusChip } from '@/components/ui/StatusChip';
import { fileUrl } from '@/lib/api';
import { api, ApiError } from '@/lib/api';

const BUSY = new Set(['QUEUED', 'RUNNING', 'STITCHING']);

export function JobCard({ generation }: { generation: GenerationDTO }) {
  const queryClient = useQueryClient();
  const previewRef = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const poster = fileUrl(generation.posterUrl);
  const video = fileUrl(generation.outputUrl);
  const busy = BUSY.has(generation.status);
  const done = generation.segments.filter((segment) => segment.status === 'SUCCEEDED').length;
  const progress = generation.segments.length
    ? Math.round((done / generation.segments.length) * 100)
    : 0;
  const created = new Date(generation.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const meta = [
    generation.aspectRatio,
    `${generation.targetDurationSec}s`,
    generation.modelsUsed.length > 0 ? generation.modelsUsed.join(' → ') : 'auto',
    created,
  ].join(' · ');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['generations'] });

  const extend = useMutation({
    mutationFn: () => api.extendGeneration(generation.id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: () => api.deleteGeneration(generation.id),
    onSuccess: invalidate,
  });
  const publish = useMutation({
    mutationFn: (next: boolean) => api.publishGeneration(generation.id, next),
    onSuccess: () => {
      setPublishError(null);
      invalidate();
    },
    onError: (err) =>
      setPublishError(err instanceof ApiError ? err.message : 'Could not update this reel'),
  });

  return (
    <>
      <article className="flex flex-col gap-3 px-4 py-4 transition-colors duration-200 hover:bg-ink-950/60 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <button
            type="button"
            onClick={() => previewRef.current?.showModal()}
            disabled={!video}
            aria-label={video ? 'Preview reel' : 'Preview not ready'}
            title={video ? 'Preview reel' : undefined}
            className="group/poster relative h-[72px] w-[54px] shrink-0 overflow-hidden rounded-[8px] bg-ink-850 disabled:cursor-default"
          >
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center font-mono text-[10px] text-ink-600">
                {generation.aspectRatio}
              </span>
            )}
            {busy ? (
              <span className="absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[2px]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </span>
            ) : video ? (
              <span className="absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition-opacity duration-200 group-hover/poster:opacity-100">
                <Play size={15} weight="fill" className="text-white" />
              </span>
            ) : null}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-[14px] leading-snug font-medium text-ink-100">
                {generation.prompt}
              </p>
              <StatusChip status={generation.status} />
            </div>

            <p className="mt-1 truncate text-[12px] text-ink-500" title={meta}>
              {meta}
            </p>

            {generation.published ? (
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12px] text-spark-text">
                <Globe size={12} />
                Published
                <span className="text-ink-500">
                  · {generation.viewCount.toLocaleString('en-US')} views ·{' '}
                  {generation.likeCount.toLocaleString('en-US')} likes
                </span>
              </p>
            ) : null}

            {busy ? (
              <div className="mt-2.5">
                <div className="h-1 w-full overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="relative h-full rounded-full bg-spark transition-[width] duration-700 ease-out-expo"
                    style={{ width: `${Math.max(progress, 6)}%` }}
                  >
                    <span className="animate-sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  </div>
                </div>
                <p className="mt-1 font-mono text-[10px] text-ink-500">
                  {done}/{generation.segments.length} segments
                </p>
              </div>
            ) : null}

            {generation.status === 'FAILED' && generation.errorMessage ? (
              <p className="mt-1.5 text-[12px] leading-relaxed text-danger">
                {generation.errorMessage}
              </p>
            ) : null}

            {publishError ? (
              <p className="mt-1.5 text-[12px] text-danger">{publishError}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-0.5 pl-[67px] sm:shrink-0 sm:justify-end sm:pl-0">
          <RowAction
            icon={<Plus size={14} weight="bold" />}
            label="Extend +5s"
            onClick={() => extend.mutate()}
            disabled={busy || generation.status !== 'SUCCEEDED' || extend.isPending}
          />
          <RowAction
            icon={
              generation.published ? (
                <GlobeHemisphereWest size={14} />
              ) : (
                <Globe size={14} />
              )
            }
            label={generation.published ? 'Unpublish' : 'Publish'}
            onClick={() => publish.mutate(!generation.published)}
            disabled={
              busy ||
              publish.isPending ||
              (!generation.published && generation.status !== 'SUCCEEDED')
            }
          />
          {video ? (
            <a
              href={video}
              download
              aria-label="Download MP4"
              title="Download MP4"
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-[12px] text-ink-500 transition-colors duration-200 hover:bg-ink-950 hover:text-ink-100"
            >
              <DownloadSimple size={14} />
              <span className="sm:hidden">MP4</span>
            </a>
          ) : null}

          {confirming ? (
            <span className="ml-1 inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => remove.mutate()}
                className="h-8 rounded-[8px] bg-danger px-2.5 text-[12px] font-medium text-white transition-opacity duration-200 hover:opacity-90"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="h-8 rounded-[8px] px-2 text-[12px] text-ink-500 transition-colors duration-200 hover:text-ink-100"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label="Delete this reel"
              title="Delete this reel"
              className="grid h-8 w-8 place-items-center rounded-[8px] text-ink-500 transition-colors duration-200 hover:bg-danger-soft hover:text-danger"
            >
              <Trash size={14} />
            </button>
          )}
        </div>
      </article>

      <dialog
        ref={previewRef}
        aria-label="Reel preview"
        onClose={() => previewRef.current?.querySelector('video')?.pause()}
        className="m-auto w-[min(92vw,400px)] overflow-hidden rounded-[20px] bg-white p-0 text-ink-100 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between border-b border-ink-700/60 px-4 py-3">
          <p className="text-[13px] font-semibold">Reel preview</p>
          <button
            type="button"
            onClick={() => previewRef.current?.close()}
            aria-label="Close preview"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-500 transition-colors duration-200 hover:bg-ink-950 hover:text-ink-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="grid place-items-center bg-black">
          {video ? (
            <video
              controls
              playsInline
              preload="metadata"
              poster={poster ?? undefined}
              src={video}
              className="max-h-[62dvh] max-w-full"
            />
          ) : null}
        </div>
        <div className="px-4 py-4">
          <p className="line-clamp-3 text-[13px] leading-relaxed text-ink-100">
            {generation.prompt}
          </p>
          <p className="mt-1.5 text-[12px] text-ink-500">{meta}</p>
        </div>
      </dialog>
    </>
  );
}

function RowAction({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-[12px] text-ink-500 transition-colors duration-200 hover:bg-ink-950 hover:text-ink-100 disabled:pointer-events-none disabled:opacity-40"
    >
      {icon}
      <span className="sm:hidden">{label}</span>
    </button>
  );
}
