import type { AspectRatio } from '@muskai/shared';
import { ASPECT_DIMENSIONS } from '@muskai/shared';
import { config } from '../../config';
import { ProviderError, QuotaExhaustedError } from '../provider.interface';
import type { CreateImageTaskParams, CreateVideoTaskParams } from '../provider.interface';

/**
 * Low-level DashScope (Alibaba Model Studio, Singapore region) HTTP client.
 *
 * ALL endpoint paths and request-body shapes live in this one file, so if a
 * DashScope detail ever differs from the docs, this is the only place to fix.
 *
 * API pattern (async tasks):
 *   POST {base}/api/v1/services/aigc/video-generation/video-synthesis
 *        headers: Authorization: Bearer <key>, X-DashScope-Async: enable
 *        → { output: { task_id, task_status: "PENDING" } }
 *   GET  {base}/api/v1/tasks/{task_id}
 *        → { output: { task_status, video_url | results[] }, code?, message? }
 *   Image generation follows the same pattern on the image-generation path.
 */

const VIDEO_SYNTHESIS_PATH = '/api/v1/services/aigc/video-generation/video-synthesis';
const IMAGE_GENERATION_PATH = '/api/v1/services/aigc/image-generation/generation';
const TASKS_PATH = '/api/v1/tasks';

/** DashScope expects sizes as "WIDTH*HEIGHT" strings. */
export function sizeForAspect(aspectRatio: AspectRatio): string {
  const { width, height } = ASPECT_DIMENSIONS[aspectRatio];
  return `${width}*${height}`;
}

interface DashScopeTaskResponse {
  output?: {
    task_id?: string;
    task_status?: string;
    video_url?: string;
    image_url?: string;
    results?: Array<{ url?: string }>;
  };
  code?: string;
  message?: string;
}

function isQuotaError(status: number, body: DashScopeTaskResponse): boolean {
  if (status !== 403) return false;
  const text = `${body.code ?? ''} ${body.message ?? ''}`;
  return text.includes('FreeTierOnly') || text.includes('AllocationQuota');
}

async function parseBody(res: Response): Promise<DashScopeTaskResponse> {
  const text = await res.text();
  try {
    return JSON.parse(text) as DashScopeTaskResponse;
  } catch {
    return { message: text.slice(0, 300) };
  }
}

async function createTask(
  path: string,
  model: string,
  body: unknown,
): Promise<string> {
  if (!config.hasDashscopeKey) {
    throw new ProviderError(
      'DASHSCOPE_API_KEY is not configured on the server. Add it to apps/api/.env and restart.',
      'MISSING_API_KEY',
    );
  }
  const res = await fetch(`${config.dashscopeBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.dashscopeApiKey}`,
      'X-DashScope-Async': 'enable',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const parsed = await parseBody(res);
  if (!res.ok) {
    if (isQuotaError(res.status, parsed)) {
      throw new QuotaExhaustedError(
        model,
        parsed.message ?? `Free quota exhausted for ${model}`,
      );
    }
    throw new ProviderError(
      `DashScope rejected the request for ${model}: ${parsed.code ?? res.status} ${parsed.message ?? ''}`.trim(),
      parsed.code ?? 'DASHSCOPE_REJECTED',
    );
  }
  const taskId = parsed.output?.task_id;
  if (!taskId) {
    throw new ProviderError(`DashScope did not return a task id for ${model}`, 'NO_TASK_ID');
  }
  return taskId;
}

/**
 * Build the `input` object for a video-synthesis call, per capability.
 * Shapes follow DashScope's documented Wan-family conventions:
 *  - t2v: { prompt }
 *  - i2v: { prompt, img_url }
 *  - kf2v (wan2.1-kf2v-plus): { prompt, first_frame_url, last_frame_url? }
 *  - vace-plus: { prompt, function, media: [{ type, url }] } — VACE is the
 *    multi-function model, so reference/edit go through its function field.
 *  - happyhorse edit/r2v: { prompt, video_url } / { prompt, img_url }
 */
export function buildVideoInput(params: CreateVideoTaskParams): Record<string, unknown> {
  const { capability, prompt } = params;
  switch (capability) {
    case 'TEXT_TO_VIDEO':
      return { prompt };
    case 'IMAGE_TO_VIDEO':
      return { prompt, img_url: params.imageUrl };
    case 'KEYFRAME_TO_VIDEO': {
      const input: Record<string, unknown> = { prompt, first_frame_url: params.firstFrameUrl };
      if (params.lastFrameUrl) input.last_frame_url = params.lastFrameUrl;
      return input;
    }
    case 'REFERENCE_TO_VIDEO':
      if (params.model.startsWith('wan2.1-vace')) {
        return {
          prompt,
          function: 'reference-to-video',
          media: [{ type: 'reference_image', url: params.imageUrl }],
        };
      }
      return { prompt, img_url: params.imageUrl };
    case 'VIDEO_EDIT':
      if (params.model.startsWith('wan2.1-vace')) {
        return {
          prompt,
          function: 'video-editing',
          media: [{ type: 'video', url: params.videoUrl }],
        };
      }
      return { prompt, video_url: params.videoUrl };
    default:
      return { prompt };
  }
}

export async function createVideoTask(params: CreateVideoTaskParams): Promise<string> {
  const body = {
    model: params.model,
    input: buildVideoInput(params),
    parameters: {
      size: sizeForAspect(params.aspectRatio),
      duration: params.durationSec,
      prompt_extend: true,
      watermark: false,
    },
  };
  return createTask(VIDEO_SYNTHESIS_PATH, params.model, body);
}

export async function createImageTask(params: CreateImageTaskParams): Promise<string> {
  const body = {
    model: params.model,
    input: { prompt: params.prompt },
    parameters: {
      size: sizeForAspect(params.aspectRatio),
      n: 1,
      prompt_extend: true,
      watermark: false,
    },
  };
  return createTask(IMAGE_GENERATION_PATH, params.model, body);
}

export interface RawTaskResult {
  status: string;
  videoUrl?: string;
  imageUrl?: string;
  code?: string;
  message?: string;
}

export async function getTask(taskId: string): Promise<RawTaskResult> {
  const res = await fetch(`${config.dashscopeBaseUrl}${TASKS_PATH}/${taskId}`, {
    headers: { Authorization: `Bearer ${config.dashscopeApiKey}` },
  });
  const parsed = await parseBody(res);
  if (!res.ok) {
    throw new ProviderError(
      `DashScope task lookup failed: ${parsed.code ?? res.status} ${parsed.message ?? ''}`.trim(),
      parsed.code ?? 'TASK_LOOKUP_FAILED',
    );
  }
  const output = parsed.output ?? {};
  return {
    status: output.task_status ?? 'UNKNOWN',
    videoUrl: output.video_url,
    // Image tasks return results[]; some return a bare image_url. Accept both.
    imageUrl: output.results?.[0]?.url ?? output.image_url,
    code: parsed.code,
    message: parsed.message,
  };
}
