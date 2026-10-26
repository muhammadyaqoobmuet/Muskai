import type { AspectRatio, GenerationMode } from './schemas';
import type { Capability } from './models';

/**
 * API response DTOs — what the Express API returns and the web app renders.
 * File fields are URLs relative to the API origin (e.g. "/files/<id>/final.mp4").
 */

export const GENERATION_STATUSES = [
  'QUEUED',
  'RUNNING',
  'STITCHING',
  'SUCCEEDED',
  'FAILED',
] as const;
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export const SEGMENT_STATUSES = ['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED'] as const;
export type SegmentStatus = (typeof SEGMENT_STATUSES)[number];

export interface SegmentDTO {
  id: string;
  index: number;
  /** DashScope model that actually produced this segment (null until run). */
  model: string | null;
  status: SegmentStatus;
  durationSec: number;
  outputUrl: string | null;
}

export interface GenerationDTO {
  id: string;
  prompt: string;
  mode: GenerationMode;
  /** Model the user explicitly picked, or null for Auto. */
  requestedModel: string | null;
  /** Distinct models that actually produced segments, in order of first use. */
  modelsUsed: string[];
  aspectRatio: AspectRatio;
  targetDurationSec: number;
  status: GenerationStatus;
  outputUrl: string | null;
  posterUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  segments: SegmentDTO[];
  /** True when the owner has shared this reel publicly. */
  published: boolean;
  /** Public view count. */
  viewCount: number;
  /** Public like count. */
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

/** One registry row enriched with live quota-ledger state (GET /api/models). */
export interface ModelInfoDTO {
  id: string;
  displayName: string;
  capability: Capability;
  quotaTotal: number;
  unitsUsed: number;
  /** quotaTotal - unitsUsed, floored at 0. The platform counts its own way,
   *  so treat this as an estimate until calibrated against real calls. */
  unitsRemaining: number;
  exhausted: boolean;
  lastError: string | null;
}

export interface HealthDTO {
  status: 'ok';
  dashscopeKeyConfigured: boolean;
  ffmpegAvailable: boolean;
}

/** The one error shape every API failure uses. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
