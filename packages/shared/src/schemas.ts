import { z } from 'zod';
import type { Capability } from './models';

/**
 * API payload schemas — the single source of truth for what the browser may
 * send and what the API accepts. Both apps import from here so the contract
 * can never drift.
 */

/** User-facing generation modes (what the Studio tabs show). */
export const GENERATION_MODES = [
  'TEXT_TO_VIDEO',
  'IMAGE_TO_VIDEO',
  'KEYFRAMES',
  'REFERENCE',
  'EDIT',
] as const;

export type GenerationMode = (typeof GENERATION_MODES)[number];

export const generationModeSchema = z.enum(GENERATION_MODES);

export const MODE_LABELS: Record<GenerationMode, string> = {
  TEXT_TO_VIDEO: 'Text to Video',
  IMAGE_TO_VIDEO: 'Image to Video',
  KEYFRAMES: 'Keyframes',
  REFERENCE: 'Reference',
  EDIT: 'Edit',
};

/** Each user mode maps to exactly one provider capability chain. */
export const MODE_TO_CAPABILITY: Record<GenerationMode, Capability> = {
  TEXT_TO_VIDEO: 'TEXT_TO_VIDEO',
  IMAGE_TO_VIDEO: 'IMAGE_TO_VIDEO',
  KEYFRAMES: 'KEYFRAME_TO_VIDEO',
  REFERENCE: 'REFERENCE_TO_VIDEO',
  EDIT: 'VIDEO_EDIT',
};

export const ASPECT_RATIOS = ['9:16', '16:9', '1:1'] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];
export const aspectRatioSchema = z.enum(ASPECT_RATIOS);

/** Output dimensions per aspect ratio (the stitch step normalises to these). */
export const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '9:16': { width: 720, height: 1280 },
  '16:9': { width: 1280, height: 720 },
  '1:1': { width: 960, height: 960 },
};

/** Reel length targets the product offers, in seconds. */
export const TARGET_DURATIONS_SEC = [5, 10, 15, 20] as const;

/** One DashScope call produces roughly this many seconds; longer reels are
 *  planned as multiple segments and stitched. */
export const SEGMENT_DURATION_SEC = 5;

const optionalUrl = z
  .string()
  .url('Must be a valid URL')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const createGenerationSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required').max(2000),
  mode: generationModeSchema,
  /** Specific DashScope model id, or null/omitted for "Auto" (chain order). */
  modelId: z.string().min(1).nullable().optional(),
  aspectRatio: aspectRatioSchema.default('9:16'),
  targetDurationSec: z
    .number()
    .int()
    .refine((v) => (TARGET_DURATIONS_SEC as readonly number[]).includes(v), {
      message: `Duration must be one of ${TARGET_DURATIONS_SEC.join(', ')} seconds`,
    })
    .default(10),
  /** Image to Video / Reference modes: the source image URL. */
  imageUrl: optionalUrl,
  /** Keyframes mode: first frame URL (blank = generate one from the prompt). */
  firstFrameUrl: optionalUrl,
  /** Keyframes mode: optional last frame URL. */
  lastFrameUrl: optionalUrl,
  /** Edit mode: the source video URL. */
  videoUrl: optionalUrl,
  /** Client-generated id — makes retries idempotent (no double quota burn). */
  clientRequestId: z.string().min(1).max(100),
});

export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;

/** Extend takes no body — it always adds one more segment. */
export const extendGenerationSchema = z.object({}).passthrough();

/** Publish/unpublish a reel to the public community feed. */
export const publishGenerationSchema = z.object({
  published: z.boolean(),
});
