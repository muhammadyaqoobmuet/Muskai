import type { Generation, Segment } from '@prisma/client';
import type { CreateGenerationInput, GenerationDTO } from '@muskai/shared';
import { SEGMENT_DURATION_SEC } from '@muskai/shared';
import { prisma } from '../db/client';
import { AppError } from '../middleware/error';
import { planSegmentCount } from './segment-planner';
import { deleteGenerationFiles, fileUrl } from './storage.service';

type GenerationWithSegments = Generation & { segments: Segment[] };

/** Map a DB row (+ its segments) to the wire DTO. */
export function toDTO(gen: GenerationWithSegments & { _count?: { likes: number } }): GenerationDTO {
  const segments = [...gen.segments].sort((a, b) => a.index - b.index);
  const modelsUsed: string[] = [];
  for (const seg of segments) {
    if (seg.model && !modelsUsed.includes(seg.model)) modelsUsed.push(seg.model);
  }
  return {
    id: gen.id,
    prompt: gen.prompt,
    mode: gen.mode as GenerationDTO['mode'],
    requestedModel: gen.requestedModel,
    modelsUsed,
    aspectRatio: gen.aspectRatio as GenerationDTO['aspectRatio'],
    targetDurationSec: gen.targetDurationSec,
    status: gen.status as GenerationDTO['status'],
    outputUrl: fileUrl(gen.outputPath),
    posterUrl: fileUrl(gen.posterPath),
    errorCode: gen.errorCode,
    errorMessage: gen.errorMessage,
    segments: segments.map((seg) => ({
      id: seg.id,
      index: seg.index,
      model: seg.model,
      status: seg.status as SegmentDTOStatus,
      durationSec: seg.durationSec,
      outputUrl: fileUrl(seg.outputPath),
    })),
    published: gen.published,
    viewCount: gen.viewCount,
    likeCount: gen._count?.likes ?? 0,
    createdAt: gen.createdAt.toISOString(),
    updatedAt: gen.updatedAt.toISOString(),
  };
}

type SegmentDTOStatus = GenerationDTO['segments'][number]['status'];

const includeSegments = { segments: true, _count: { select: { likes: true } } } as const;

/**
 * Create a generation job. Idempotent on clientRequestId: a retried submit
 * returns the existing job instead of burning quota twice.
 */
export async function createGeneration(
  input: CreateGenerationInput,
  userId: string,
): Promise<GenerationDTO> {
  const existing = await prisma.generation.findUnique({
    where: { clientRequestId: input.clientRequestId },
    include: includeSegments,
  });
  if (existing) return toDTO(existing);

  const gen = await prisma.generation.create({
    data: {
      userId,
      prompt: input.prompt,
      mode: input.mode,
      requestedModel: input.modelId ?? null,
      aspectRatio: input.aspectRatio,
      targetDurationSec: input.targetDurationSec,
      imageUrl: input.imageUrl ?? null,
      firstFrameUrl: input.firstFrameUrl ?? null,
      lastFrameUrl: input.lastFrameUrl ?? null,
      videoUrl: input.videoUrl ?? null,
      clientRequestId: input.clientRequestId,
      segments: {
        create: Array.from({ length: planSegmentCount(input.targetDurationSec) }, (_, i) => ({
          index: i,
          durationSec: SEGMENT_DURATION_SEC,
        })),
      },
    },
    include: includeSegments,
  });
  return toDTO(gen);
}

/** Every generation owned by this user, newest first. */
export async function listGenerations(userId: string): Promise<GenerationDTO[]> {
  const gens = await prisma.generation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: includeSegments,
    take: 100,
  });
  return gens.map(toDTO);
}

export async function getGeneration(id: string, userId: string): Promise<GenerationDTO> {
  const gen = await prisma.generation.findFirst({
    where: { id, userId },
    include: includeSegments,
  });
  if (!gen) throw new AppError(404, 'GENERATION_NOT_FOUND', 'No generation with that id');
  return toDTO(gen);
}

/**
 * Add one more segment to a finished reel: the worker picks the job back up,
 * generates the extension from the current last frame, and re-stitches.
 */
export async function extendGeneration(id: string, userId: string): Promise<GenerationDTO> {
  const gen = await prisma.generation.findFirst({
    where: { id, userId },
    include: includeSegments,
  });
  if (!gen) throw new AppError(404, 'GENERATION_NOT_FOUND', 'No generation with that id');
  if (gen.status !== 'SUCCEEDED') {
    throw new AppError(
      409,
      'GENERATION_NOT_FINISHED',
      'Only a finished generation can be extended',
    );
  }
  const nextIndex = gen.segments.length;
  const updated = await prisma.generation.update({
    where: { id },
    data: {
      status: 'QUEUED',
      targetDurationSec: gen.targetDurationSec + SEGMENT_DURATION_SEC,
      segments: { create: { index: nextIndex, durationSec: SEGMENT_DURATION_SEC } },
    },
    include: includeSegments,
  });
  return toDTO(updated);
}

export async function deleteGeneration(id: string, userId: string): Promise<void> {
  const gen = await prisma.generation.findFirst({ where: { id, userId } });
  if (!gen) throw new AppError(404, 'GENERATION_NOT_FOUND', 'No generation with that id');
  await prisma.generation.delete({ where: { id } });
  await deleteGenerationFiles(id);
}

/** Publish or unpublish a reel to the community feed. */
export async function setPublished(
  id: string,
  userId: string,
  published: boolean,
): Promise<GenerationDTO> {
  const gen = await prisma.generation.findFirst({ where: { id, userId } });
  if (!gen) throw new AppError(404, 'GENERATION_NOT_FOUND', 'No generation with that id');
  if (published && gen.status !== 'SUCCEEDED') {
    throw new AppError(409, 'REEL_NOT_READY', 'Only a finished reel can be published');
  }
  const updated = await prisma.generation.update({
    where: { id },
    data: {
      published,
      publishedAt: published ? (gen.publishedAt ?? new Date()) : null,
    },
    include: includeSegments,
  });
  return toDTO(updated);
}
