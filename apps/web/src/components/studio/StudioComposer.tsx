'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ASPECT_RATIOS,
  GENERATION_MODES,
  MODE_LABELS,
  MODE_TO_CAPABILITY,
  SEGMENT_DURATION_SEC,
  TARGET_DURATIONS_SEC,
} from '@muskai/shared';
import type { AspectRatio, CreateGenerationInput, GenerationMode } from '@muskai/shared';
import { Sparkle } from '@phosphor-icons/react';
import { useSearchParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DissolveTextarea } from '@/components/ui/DissolveTextarea';
import { Field, Input, Select, TEXTAREA_TEXT, textareaStyles } from '@/components/ui/Field';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { PROMPT_STARTERS } from '@/lib/showcase';
import { api } from '@/lib/api';

const ASPECT_OPTIONS = ASPECT_RATIOS.map((ratio) => ({
  value: ratio,
  label: ratio,
  hint: ratio === '9:16' ? 'Vertical, for feeds' : ratio === '16:9' ? 'Landscape' : 'Square',
}));

const DURATION_OPTIONS = TARGET_DURATIONS_SEC.map((seconds) => ({
  value: String(seconds),
  label: `${seconds}s`,
  hint: `${Math.round(seconds / SEGMENT_DURATION_SEC)} segment${
    seconds / SEGMENT_DURATION_SEC === 1 ? '' : 's'
  }`,
}));

const MODE_SHORT: Record<GenerationMode, string> = {
  TEXT_TO_VIDEO: 'Text',
  IMAGE_TO_VIDEO: 'Image',
  KEYFRAMES: 'Keyframes',
  REFERENCE: 'Reference',
  EDIT: 'Edit',
};

function parseMode(value: string | null): GenerationMode {
  return (GENERATION_MODES as readonly string[]).includes(value ?? '')
    ? (value as GenerationMode)
    : 'TEXT_TO_VIDEO';
}

function parseAspect(value: string | null): AspectRatio {
  return (ASPECT_RATIOS as readonly string[]).includes(value ?? '')
    ? (value as AspectRatio)
    : '9:16';
}

export function StudioComposer() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [prompt, setPrompt] = useState(searchParams.get('prompt') ?? '');
  const [mode, setMode] = useState<GenerationMode>(() => parseMode(searchParams.get('mode')));
  const [aspect, setAspect] = useState<AspectRatio>(() => parseAspect(searchParams.get('aspect')));
  const [duration, setDuration] = useState(10);
  const [modelId, setModelId] = useState('auto');
  const [imageUrl, setImageUrl] = useState('');
  const [firstFrameUrl, setFirstFrameUrl] = useState('');
  const [lastFrameUrl, setLastFrameUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [spending, setSpending] = useState(false);

  const requestIdRef = useRef<string>(crypto.randomUUID());

  const modelsQuery = useQuery({ queryKey: ['models'], queryFn: api.listModels });

  const chainModels = useMemo(
    () => (modelsQuery.data ?? []).filter((m) => m.capability === MODE_TO_CAPABILITY[mode]),
    [modelsQuery.data, mode],
  );

  const create = useMutation({
    mutationFn: (input: CreateGenerationInput) => api.createGeneration(input),
    onSuccess: () => {
      requestIdRef.current = crypto.randomUUID();
      setSpending(true);
      void queryClient.invalidateQueries({ queryKey: ['generations'] });
      void queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });

  const submit = () => {
    if (!prompt.trim()) return;
    create.mutate({
      prompt: prompt.trim(),
      mode,
      modelId: modelId === 'auto' ? null : modelId,
      aspectRatio: aspect,
      targetDurationSec: duration,
      imageUrl: imageUrl.trim() || undefined,
      firstFrameUrl: firstFrameUrl.trim() || undefined,
      lastFrameUrl: lastFrameUrl.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      clientRequestId: requestIdRef.current,
    });
  };

  const segments = Math.round(duration / SEGMENT_DURATION_SEC);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="overflow-hidden rounded-[16px] bg-white ring-1 ring-ink-700/70"
    >
      <div className="border-b border-ink-700/60 px-5 py-4">
        <h2 className="text-[15px] font-semibold text-ink-100">New reel</h2>
        <p className="mt-0.5 text-[12px] text-ink-500">
          Describe the shot, set the format, and queue the render.
        </p>
      </div>

      <div className="p-5">
        <Tabs value={mode} onValueChange={(next) => setMode(next as GenerationMode)}>
          <TabsList aria-label="Generation mode">
            {GENERATION_MODES.map((option) => (
              <TabsTrigger key={option} value={option} title={MODE_LABELS[option]}>
                {MODE_SHORT[option]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-5">
          <Field
            label="Prompt"
            htmlFor="prompt"
            hint="Describe the shot, the motion and the mood."
          >
            <DissolveTextarea
              id="prompt"
              rows={4}
              required
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="A lone surfer carving a wave at dusk, shot from the water"
              className={textareaStyles()}
              textClassName={TEXTAREA_TEXT}
              spending={spending}
              onSpent={() => {
                setPrompt('');
                setSpending(false);
              }}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12px] text-ink-500">Try</span>
            {PROMPT_STARTERS.map((starter) => (
              <button
                key={starter.label}
                type="button"
                title={starter.prompt}
                onClick={() => setPrompt(starter.prompt)}
                className="h-7 rounded-full border border-ink-700 px-2.5 text-[12px] text-ink-400 transition-colors duration-200 hover:border-ink-100 hover:text-ink-100"
              >
                {starter.label}
              </button>
            ))}
          </div>
        </div>

        {mode === 'IMAGE_TO_VIDEO' || mode === 'REFERENCE' ? (
          <div className="mt-4">
            <Field label="Source image URL" htmlFor="imageUrl">
              <Input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/frame.jpg"
              />
            </Field>
          </div>
        ) : null}

        {mode === 'KEYFRAMES' ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="First frame URL"
              htmlFor="firstFrame"
              hint="Leave blank and one gets generated."
            >
              <Input
                id="firstFrame"
                type="url"
                value={firstFrameUrl}
                onChange={(event) => setFirstFrameUrl(event.target.value)}
                placeholder="https://example.com/first.jpg"
              />
            </Field>
            <Field label="Last frame URL" htmlFor="lastFrame">
              <Input
                id="lastFrame"
                type="url"
                value={lastFrameUrl}
                onChange={(event) => setLastFrameUrl(event.target.value)}
                placeholder="https://example.com/last.jpg"
              />
            </Field>
          </div>
        ) : null}

        {mode === 'EDIT' ? (
          <div className="mt-4">
            <Field label="Source video URL" htmlFor="videoUrl">
              <Input
                id="videoUrl"
                type="url"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                placeholder="https://example.com/clip.mp4"
              />
            </Field>
          </div>
        ) : null}

        <div className="mt-5 space-y-4 border-t border-ink-700/60 pt-5">
          <Field label="Engine" htmlFor="model">
            <Select
              id="model"
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
            >
              <option value="auto">Auto (fallback chain)</option>
              {chainModels.map((model) => (
                <option key={model.id} value={model.id} disabled={model.exhausted}>
                  {model.displayName} · {model.unitsRemaining} units left
                  {model.exhausted ? ' (spent)' : ''}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Shape">
              <SegmentedControl
                ariaLabel="Aspect ratio"
                options={ASPECT_OPTIONS}
                value={aspect}
                onChange={setAspect}
                fullWidth
              />
            </Field>

            <Field label="Length">
              <SegmentedControl
                ariaLabel="Duration"
                options={DURATION_OPTIONS}
                value={String(duration)}
                onChange={(value) => setDuration(Number(value))}
                fullWidth
              />
            </Field>
          </div>

          <div>
            <Button
              type="submit"
              disabled={create.isPending || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              <Sparkle size={15} weight={create.isPending ? 'regular' : 'fill'} />
              {create.isPending ? 'Queueing' : 'Generate reel'}
            </Button>
            <p className="mt-3 text-center text-[12px] text-ink-500">
              {duration}s reel · {segments} × {SEGMENT_DURATION_SEC}s{' '}
              {segments === 1 ? 'segment' : 'segments'}
            </p>
          </div>

          {create.isError ? (
            <p role="alert" className="text-[13px] leading-relaxed text-danger">
              {create.error instanceof Error ? create.error.message : 'Could not queue the job.'}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
