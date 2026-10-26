import type { Prisma } from '@prisma/client';
import type { AuthorDTO, ReelDTO, ReelFeedQuery } from '@muskai/shared';
import { prisma } from '../db/client';
import { AppError } from '../middleware/error';
import { fileUrl } from './storage.service';
import { avatarUrl } from './user.service';

/**
 * The community surface: reels that creators published, plus the social
 * layer around them (likes, views, author profiles).
 */

type ReelRow = Prisma.GenerationGetPayload<{
  include: {
    user: true;
    segments: { select: { model: true } };
    _count: { select: { likes: true } };
  };
}>;

function toAuthorDTO(user: NonNullable<ReelRow['user']>): AuthorDTO {
  return {
    id: user.id,
    name: user.name,
    handle: user.handle,
    avatarUrl: avatarUrl(user.handle),
  };
}

export function toReelDTO(row: ReelRow, viewerId: string | null, liked: boolean): ReelDTO {
  const modelsUsed: string[] = [];
  for (const seg of row.segments) {
    if (seg.model && !modelsUsed.includes(seg.model)) modelsUsed.push(seg.model);
  }
  const author = row.user
    ? toAuthorDTO(row.user)
    : { id: '', name: 'Unknown creator', handle: 'unknown', avatarUrl: avatarUrl('unknown') };
  return {
    id: row.id,
    prompt: row.prompt,
    mode: row.mode as ReelDTO['mode'],
    aspectRatio: row.aspectRatio as ReelDTO['aspectRatio'],
    targetDurationSec: row.targetDurationSec,
    modelsUsed,
    status: row.status,
    outputUrl: fileUrl(row.outputPath),
    posterUrl: fileUrl(row.posterPath),
    author,
    likeCount: row._count.likes,
    likedByMe: liked,
    viewCount: row.viewCount,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

const reelInclude = {
  user: true,
  segments: { select: { model: true } },
  _count: { select: { likes: true } },
} as const;

/** The public feed of published reels, newest first. */
export async function listPublicReels(
  query: ReelFeedQuery,
  viewerId: string | null,
): Promise<ReelDTO[]> {
  const where: Prisma.GenerationWhereInput = {
    published: true,
    userId: { not: null },
    ...(query.handle ? { user: { handle: query.handle } } : {}),
  };

  const rows = await prisma.generation.findMany({
    where,
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    skip: query.offset,
    take: query.limit,
    include: reelInclude,
  });

  const liked = await likedIds(rows.map((r) => r.id), viewerId);
  return rows.map((row) => toReelDTO(row, viewerId, liked.has(row.id)));
}

/** A single published reel. Increments the view counter as a side effect. */
export async function getPublicReel(
  id: string,
  viewerId: string | null,
  opts: { countView?: boolean } = {},
): Promise<ReelDTO> {
  const row = await prisma.generation.findFirst({
    where: { id, published: true, userId: { not: null } },
    include: reelInclude,
  });
  if (!row) throw new AppError(404, 'REEL_NOT_FOUND', 'That reel does not exist or is private');

  if (opts.countView !== false && row.userId !== viewerId) {
    await prisma.generation
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);
    row.viewCount += 1;
  }

  const liked = await likedIds([id], viewerId);
  return toReelDTO(row, viewerId, liked.has(id));
}

/** Toggle a like. Returns the new state. */
export async function toggleLike(
  reelId: string,
  userId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const reel = await prisma.generation.findFirst({
    where: { id: reelId, published: true },
    select: { id: true },
  });
  if (!reel) throw new AppError(404, 'REEL_NOT_FOUND', 'That reel does not exist or is private');

  const existing = await prisma.like.findUnique({
    where: { userId_generationId: { userId, generationId: reelId } },
  });

  if (existing) {
    await prisma.like.delete({
      where: { userId_generationId: { userId, generationId: reelId } },
    });
  } else {
    await prisma.like.create({ data: { userId, generationId: reelId } });
  }

  const likeCount = await prisma.like.count({ where: { generationId: reelId } });
  return { liked: !existing, likeCount };
}

export interface PublicProfile {
  id: string;
  name: string;
  handle: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  reelCount: number;
  totalLikes: number;
}

export async function getProfile(handle: string): Promise<PublicProfile> {
  const user = await prisma.user.findUnique({ where: { handle } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'No creator with that handle');

  const [reelCount, likes] = await Promise.all([
    prisma.generation.count({ where: { userId: user.id, published: true } }),
    prisma.like.count({ where: { generation: { userId: user.id } } }),
  ]);

  return {
    id: user.id,
    name: user.name,
    handle: user.handle,
    bio: user.bio,
    avatarUrl: avatarUrl(user.handle),
    createdAt: user.createdAt.toISOString(),
    reelCount,
    totalLikes: likes,
  };
}

/** Which of `ids` the viewer has liked. */
async function likedIds(ids: string[], viewerId: string | null): Promise<Set<string>> {
  if (!viewerId || ids.length === 0) return new Set();
  const likes = await prisma.like.findMany({
    where: { userId: viewerId, generationId: { in: ids } },
    select: { generationId: true },
  });
  return new Set(likes.map((l) => l.generationId));
}
