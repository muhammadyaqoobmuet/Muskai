import type { AspectRatio, Capability } from '@muskai/shared';

/**
 * The provider boundary. Services only ever see this interface, so a second
 * provider (HF, Pollinations…) can be added without touching business logic.
 */

export interface CreateVideoTaskParams {
  model: string;
  capability: Capability;
  prompt: string;
  /** IMAGE_TO_VIDEO / REFERENCE: source image (URL or base64 data URI). */
  imageUrl?: string;
  /** KEYFRAME_TO_VIDEO: first frame. */
  firstFrameUrl?: string;
  /** KEYFRAME_TO_VIDEO: optional last frame. */
  lastFrameUrl?: string;
  /** VIDEO_EDIT: source video URL. */
  videoUrl?: string;
  aspectRatio: AspectRatio;
  durationSec: number;
}

export interface CreateImageTaskParams {
  model: string;
  prompt: string;
  aspectRatio: AspectRatio;
}

export type TaskState = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface TaskResult {
  state: TaskState;
  videoUrl?: string;
  imageUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface VideoProvider {
  /** Create an async video task; resolves with the DashScope task id. */
  createVideoTask(params: CreateVideoTaskParams): Promise<string>;
  /** Create an async image task (keyframe generation). */
  createImageTask(params: CreateImageTaskParams): Promise<string>;
  /** Poll a task once. */
  getTask(taskId: string): Promise<TaskResult>;
  /** Poll until the task succeeds/fails or the timeout is hit. */
  waitForTask(taskId: string, timeoutMs?: number): Promise<TaskResult>;
}

/** The model's free-quota pool is empty (HTTP 403 FreeTierOnly).
 *  The model router treats this as a *signal* to try the next model,
 *  not as a job failure. */
export class QuotaExhaustedError extends Error {
  constructor(
    public readonly model: string,
    message: string,
  ) {
    super(message);
    this.name = 'QuotaExhaustedError';
  }
}

/** Any other provider-side failure (bad request, task FAILED, network…). */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'PROVIDER_ERROR',
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
