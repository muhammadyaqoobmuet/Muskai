import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';

/**
 * Owns everything under the storage dir. DashScope result URLs expire within
 * ~24h, so every result is downloaded here the moment its task succeeds and
 * is then served by this API under /files.
 *
 * Layout: storage/<generationId>/seg-0.mp4, frame-1.jpg, final.mp4, poster.jpg
 * DB rows store paths relative to the storage root ("<id>/final.mp4").
 */

export function absPath(relativePath: string): string {
  return path.join(config.storageDir, relativePath);
}

/** URL path the file is served on (DTOs prefix it with the API origin). */
export function fileUrl(relativePath: string | null): string | null {
  return relativePath ? `/files/${relativePath}` : null;
}

export async function downloadToFile(url: string, relativePath: string): Promise<void> {
  const dest = absPath(relativePath);
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}) for ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fsp.writeFile(dest, buffer);
}

export async function deleteGenerationFiles(generationId: string): Promise<void> {
  await fsp.rm(absPath(generationId), { recursive: true, force: true });
}

/**
 * How DashScope can reach one of our stored frames (needed as img_url /
 * first_frame_url inputs). If the API is publicly reachable
 * (PUBLIC_FILES_BASE_URL set), hand out the real URL. Otherwise fall back to
 * a base64 data URI — DashScope accepts data URIs for image inputs; if a
 * specific model rejects it, set PUBLIC_FILES_BASE_URL (e.g. a tunnel) and
 * the URL path is used instead.
 */
export async function frameReference(relativePath: string): Promise<string> {
  if (config.publicFilesBaseUrl) {
    return `${config.publicFilesBaseUrl}/files/${relativePath}`;
  }
  const data = await fsp.readFile(absPath(relativePath));
  return `data:image/jpeg;base64,${data.toString('base64')}`;
}

export function storageExists(relativePath: string): boolean {
  return fs.existsSync(absPath(relativePath));
}
