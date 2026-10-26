import { execFile } from 'node:child_process';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type { AspectRatio } from '@muskai/shared';
import { ASPECT_DIMENSIONS } from '@muskai/shared';
import { absPath } from './storage.service';

/**
 * ffmpeg wrappers (no fluent-ffmpeg — plain execFile). Used for:
 *  - extracting the last frame of a segment (feeds the next i2v extension)
 *  - concatenating segments into the final reel at a uniform size/fps
 *  - grabbing a poster frame for the UI
 *
 * If ffmpeg is missing on the machine the worker degrades gracefully:
 * a single-segment output becomes the final file as-is.
 */

const execFileAsync = promisify(execFile);

let ffmpegAvailableCache: boolean | null = null;

export async function hasFfmpeg(): Promise<boolean> {
  if (ffmpegAvailableCache !== null) return ffmpegAvailableCache;
  try {
    await execFileAsync('ffmpeg', ['-version']);
    ffmpegAvailableCache = true;
  } catch {
    ffmpegAvailableCache = false;
  }
  return ffmpegAvailableCache;
}

/** Extract the last frame of a video as a JPEG (relative storage paths). */
export async function extractLastFrame(
  videoRelPath: string,
  outRelPath: string,
): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-y',
    '-sseof', '-0.5', // seek to 0.5s before the end — cheap and reliable
    '-i', absPath(videoRelPath),
    '-frames:v', '1',
    '-q:v', '2',
    absPath(outRelPath),
  ]);
}

/** Grab a poster frame ~1s into the video. */
export async function extractPoster(videoRelPath: string, outRelPath: string): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-y',
    '-ss', '1',
    '-i', absPath(videoRelPath),
    '-frames:v', '1',
    '-q:v', '3',
    absPath(outRelPath),
  ]);
}

/**
 * Concatenate segment files into one reel, re-encoded to a uniform
 * size/fps/pixel-format so every player handles it. Audio is dropped:
 * these models' outputs are effectively silent and mixed audio tracks
 * break the concat demuxer.
 */
export async function concatSegments(
  segmentRelPaths: string[],
  outRelPath: string,
  aspectRatio: AspectRatio,
): Promise<void> {
  const { width, height } = ASPECT_DIMENSIONS[aspectRatio];
  const listRelPath = `${path.dirname(outRelPath)}/concat-list.txt`;
  const listContents = segmentRelPaths
    .map((p) => `file '${absPath(p).replace(/'/g, "'\\''")}'`)
    .join('\n');
  await fsp.writeFile(absPath(listRelPath), listContents);
  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', absPath(listRelPath),
      '-vf',
      `scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
        `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=25,format=yuv420p`,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-an',
      absPath(outRelPath),
    ]);
  } finally {
    await fsp.rm(absPath(listRelPath), { force: true });
  }
}
