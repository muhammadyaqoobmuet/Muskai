import { SEGMENT_DURATION_SEC } from '@muskai/shared';

/**
 * Pure planning helpers: how many ~5s segments a target duration needs,
 * and how an extension segment should be prompted.
 */

export function planSegmentCount(targetDurationSec: number): number {
  return Math.max(1, Math.ceil(targetDurationSec / SEGMENT_DURATION_SEC));
}

/** Extension segments continue from the previous segment's last frame. */
export function continuationPrompt(originalPrompt: string): string {
  return `Continue the scene naturally from this frame, seamless motion, same subject and style: ${originalPrompt}`;
}
