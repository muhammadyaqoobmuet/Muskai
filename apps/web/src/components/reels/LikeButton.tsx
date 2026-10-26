'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from '@phosphor-icons/react';
import { useState } from 'react';
import { useSession } from '@/components/session/SessionProvider';
import { api } from '@/lib/api';

/**
 * A like is instant and optimistic: the heart fills the moment you press it,
 * and the count only corrects itself if the server disagrees.
 */
export function LikeButton({
  reelId,
  initialLiked,
  initialCount,
  size = 18,
}: {
  reelId: string;
  initialLiked: boolean;
  initialCount: number;
  size?: number;
}) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [state, setState] = useState({ liked: initialLiked, count: initialCount });

  const mutation = useMutation({
    mutationFn: () => api.likeReel(reelId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['reels'] });
      const previous = state;
      setState((s) => ({ liked: !s.liked, count: s.count + (s.liked ? -1 : 1) }));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) setState(context.previous);
    },
    onSuccess: (data) => {
      setState({ liked: data.liked, count: data.likeCount });
    },
  });

  if (!user) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-ink-400">
        <Heart size={size} />
        {state.count}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      aria-pressed={state.liked}
      aria-label={state.liked ? 'Remove like' : 'Like this reel'}
      className={`inline-flex items-center gap-2 rounded-control px-3 py-2 text-sm transition-[color,background-color,transform] duration-200 active:scale-95 ${
        state.liked
          ? 'text-spark-text hover:bg-spark/10'
          : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100'
      }`}
    >
      <Heart size={size} weight={state.liked ? 'fill' : 'regular'} />
      <span className="font-mono tabular-nums">{state.count}</span>
    </button>
  );
}
