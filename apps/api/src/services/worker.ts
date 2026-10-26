import fs from 'node:fs';
import fsp from 'node:fs/promises';
import type { Generation, Segment } from '@prisma/client';
import type { AspectRatio, Capability } from '@muskai/shared';
import { MODE_TO_CAPABILITY, SEGMENT_DURATION_SEC } from '@muskai/shared';
import { prisma } from '../db/client';
import { DashScopeProvider } from '../providers/dashscope.provider';
import { ProviderError } from '../providers/provider.interface';
import { runWithFallback } from './model-router';
import { continuationPrompt } from './segment-planner';
import * as storage from './storage.service';
import * as stitch from './stitch.service';

/**
 * The worker: a DB-backed queue loop inside the API process (no Redis).
 * Every 2s it claims QUEUED generations (max 2 at a time) and drives each
 * through segment generation → stitching → SUCCEEDED | FAILED.
 *
 * Segment strategy:
 *  - Segment 0 follows the job's mode (t2v / i2v / keyframes / reference / edit).
 *  - Segments 1..n are extensions: last frame of the previous segment →
 *    IMAGE_TO_VIDEO chain with a continuation prompt.
 *  - Keyframes mode generates its frames through the TEXT_TO_IMAGE chain
 *    when the user didn't supply frame URLs.
 */

const provider = new DashScopeProvider();
const TICK_MS = 2_000;
const MAX_CONCURRENT = 2;

const active = new Set<string>();
let timer: NodeJS.Timeout | null = null;

export function startWorker(): void {
  if (timer) return;
  void recoverInterruptedJobs();
  timer = setInterval(() => void tick(), TICK_MS);
  console.log('[worker] started (DB queue, concurrency 2)');
}

/** Jobs left mid-flight by a previous process run become claimable again. */
async function recoverInterruptedJobs(): Promise<void> {
  await prisma.segment.updateMany({
    where: { status: 'RUNNING' },
    data: { status: 'PENDING' },
  });
  await prisma.generation.updateMany({
    where: { status: { in: ['RUNNING', 'STITCHING'] } },
    data: { status: 'QUEUED' },
  });
}

async function tick(): Promise<void> {
  if (active.size >= MAX_CONCURRENT) return;
  const next = await prisma.generation.findFirst({
    where: { status: 'QUEUED' },
    orderBy: { createdAt: 'asc' },
  });
  if (!next) return;
  // Atomic claim: only wins if the row is still QUEUED.
  const claimed = await prisma.generation.updateMany({
    where: { id: next.id, status: 'QUEUED' },
    data: { status: 'RUNNING' },
  });
  if (claimed.count === 0) return;
  active.add(next.id);
  void processGeneration(next.id)
    .catch((err: unknown) => console.error('[worker] unexpected failure:', err))
    .finally(() => {
      active.delete(next.id);
      void tick(); // immediately look for more work
    });
}

async function processGeneration(generationId: string): Promise<void> {
  const gen = await prisma.generation.findUnique({
    where: { id: generationId },
    include: { segments: { orderBy: { index: 'asc' } } },
  });
  if (!gen) return;

  try {
    for (const segment of gen.segments) {
      if (segment.status === 'SUCCEEDED') continue;
      await processSegment(gen, segment, gen.segments);
    }
    await finishGeneration(gen);
  } catch (err) {
    const code =
      err instanceof ProviderError
        ? err.code
        : err instanceof Error && err.name === 'QuotaExhaustedError'
          ? 'QUOTA_EXHAUSTED'
          : 'GENERATION_FAILED';
    const message = err instanceof Error ? err.message : String(err);
    await prisma.generation
      .update({ where: { id: generationId }, data: { status: 'FAILED', errorCode: code, errorMessage: message } })
      .catch(() => undefined); // row may have been deleted mid-flight
    console.warn(`[worker] generation ${generationId} failed: ${message}`);
  }
}

async function processSegment(
  gen: Generation,
  segment: Segment,
  allSegments: Segment[],
): Promise<void> {
  await prisma.segment.update({ where: { id: segment.id }, data: { status: 'RUNNING' } });
  try {
    const { capability, buildParams } = await planSegmentInput(gen, segment, allSegments);
    const outcome = await runWithFallback(capability, gen.requestedModel, async (modelId) => {
      const taskId = await provider.createVideoTask({ ...buildParams, model: modelId });
      await prisma.segment.update({ where: { id: segment.id }, data: { dashscopeTaskId: taskId } });
      const result = await provider.waitForTask(taskId);
      if (result.state !== 'SUCCEEDED' || !result.videoUrl) {
        throw new ProviderError(
          result.errorMessage ?? 'Video task failed',
          result.errorCode ?? 'TASK_FAILED',
        );
      }
      // DashScope URLs expire — download immediately.
      const relPath = `${gen.id}/seg-${segment.index}.mp4`;
      await storage.downloadToFile(result.videoUrl, relPath);
      return relPath;
    });
    await prisma.segment.update({
      where: { id: segment.id },
      data: { status: 'SUCCEEDED', model: outcome.model, outputPath: outcome.value },
    });
  } catch (err) {
    await prisma.segment
      .update({
        where: { id: segment.id },
        data: { status: 'FAILED', errorMessage: err instanceof Error ? err.message : String(err) },
      })
      .catch(() => undefined);
    throw err;
  }
}

interface SegmentInput {
  capability: Capability;
  buildParams: {
    capability: Capability;
    prompt: string;
    imageUrl?: string;
    firstFrameUrl?: string;
    lastFrameUrl?: string;
    videoUrl?: string;
    aspectRatio: AspectRatio;
    durationSec: number;
  };
}

/** Decide what a segment should ask the provider for. */
async function planSegmentInput(
  gen: Generation,
  segment: Segment,
  allSegments: Segment[],
): Promise<SegmentInput> {
  const base = {
    aspectRatio: gen.aspectRatio as AspectRatio,
    durationSec: SEGMENT_DURATION_SEC,
  };

  // Extension segments (index ≥ 1): continue from the previous last frame.
  if (segment.index > 0) {
    const prev = allSegments.find((s) => s.index === segment.index - 1);
    if (!prev?.outputPath) {
      throw new ProviderError('Previous segment has no output to extend from', 'NO_PREVIOUS_SEGMENT');
    }
    const frameRelPath = `${gen.id}/frame-${segment.index}.jpg`;
    if (await stitch.hasFfmpeg()) {
      await stitch.extractLastFrame(prev.outputPath, frameRelPath);
      await prisma.segment.update({
        where: { id: segment.id },
        data: { sourceFramePath: frameRelPath },
      });
    } else {
      throw new ProviderError(
        'ffmpeg is required to extend a reel beyond one segment (frame extraction)',
        'FFMPEG_MISSING',
      );
    }
    return {
      capability: 'IMAGE_TO_VIDEO',
      buildParams: {
        ...base,
        capability: 'IMAGE_TO_VIDEO',
        prompt: continuationPrompt(gen.prompt),
        imageUrl: await storage.frameReference(frameRelPath),
      },
    };
  }

  // Segment 0: the job's own mode.
  const mode = gen.mode as keyof typeof MODE_TO_CAPABILITY;
  const capability = MODE_TO_CAPABILITY[mode];
  switch (mode) {
    case 'TEXT_TO_VIDEO':
      return { capability, buildParams: { ...base, capability, prompt: gen.prompt } };
    case 'IMAGE_TO_VIDEO':
      if (!gen.imageUrl) throw new ProviderError('Image to Video mode needs an image URL', 'MISSING_INPUT');
      return {
        capability,
        buildParams: { ...base, capability, prompt: gen.prompt, imageUrl: gen.imageUrl },
      };
    case 'REFERENCE':
      if (!gen.imageUrl) throw new ProviderError('Reference mode needs a reference image URL', 'MISSING_INPUT');
      return {
        capability,
        buildParams: { ...base, capability, prompt: gen.prompt, imageUrl: gen.imageUrl },
      };
    case 'EDIT':
      if (!gen.videoUrl) throw new ProviderError('Edit mode needs a source video URL', 'MISSING_INPUT');
      return {
        capability,
        buildParams: { ...base, capability, prompt: gen.prompt, videoUrl: gen.videoUrl },
      };
    case 'KEYFRAMES': {
      const firstFrameUrl = gen.firstFrameUrl ?? (await generateKeyframe(gen, segment.index));
      return {
        capability,
        buildParams: {
          ...base,
          capability,
          prompt: gen.prompt,
          firstFrameUrl,
          lastFrameUrl: gen.lastFrameUrl ?? undefined,
        },
      };
    }
    default:
      throw new ProviderError(`Unknown generation mode: ${gen.mode}`, 'UNKNOWN_MODE');
  }
}

/** Generate a keyframe image via the TEXT_TO_IMAGE chain; returns a frame reference. */
async function generateKeyframe(gen: Generation, segmentIndex: number): Promise<string> {
  const outcome = await runWithFallback('TEXT_TO_IMAGE', null, async (modelId) => {
    const taskId = await provider.createImageTask({
      model: modelId,
      prompt: gen.prompt,
      aspectRatio: gen.aspectRatio as AspectRatio,
    });
    const result = await provider.waitForTask(taskId);
    if (result.state !== 'SUCCEEDED' || !result.imageUrl) {
      throw new ProviderError(result.errorMessage ?? 'Image task failed', result.errorCode ?? 'TASK_FAILED');
    }
    const relPath = `${gen.id}/keyframe-${segmentIndex}.jpg`;
    await storage.downloadToFile(result.imageUrl, relPath);
    return relPath;
  });
  return storage.frameReference(outcome.value);
}

/** Stitch all segments (or degrade gracefully) and mark the job SUCCEEDED. */
async function finishGeneration(gen: Generation): Promise<void> {
  const segments = await prisma.segment.findMany({
    where: { generationId: gen.id },
    orderBy: { index: 'asc' },
  });
  const outputs = segments
    .map((s) => s.outputPath)
    .filter((p): p is string => typeof p === 'string');
  if (outputs.length === 0 || outputs.length !== segments.length) {
    throw new ProviderError('Not all segments completed', 'SEGMENTS_INCOMPLETE');
  }

  await prisma.generation.update({ where: { id: gen.id }, data: { status: 'STITCHING' } });
  const finalRelPath = `${gen.id}/final.mp4`;
  const ffmpeg = await stitch.hasFfmpeg();

  if (ffmpeg && outputs.length > 1) {
    await stitch.concatSegments(outputs, finalRelPath, gen.aspectRatio as AspectRatio);
  } else {
    if (!ffmpeg && outputs.length > 1) {
      // Degraded mode: no ffmpeg on this machine — ship the first segment
      // as the final file so the job still succeeds with something real.
      console.warn('[worker] ffmpeg missing — using first segment as the final output');
    }
    await fsp.copyFile(storage.absPath(outputs[0] as string), storage.absPath(finalRelPath));
  }

  let posterPath: string | null = null;
  if (ffmpeg) {
    const rel = `${gen.id}/poster.jpg`;
    try {
      await stitch.extractPoster(finalRelPath, rel);
      if (fs.existsSync(storage.absPath(rel))) posterPath = rel;
    } catch {
      posterPath = null; // a poster is a nicety, never fail the job over it
    }
  }

  await prisma.generation.update({
    where: { id: gen.id },
    data: { status: 'SUCCEEDED', outputPath: finalRelPath, posterPath, errorCode: null, errorMessage: null },
  });
  console.log(`[worker] generation ${gen.id} succeeded (${outputs.length} segment(s))`);
}
