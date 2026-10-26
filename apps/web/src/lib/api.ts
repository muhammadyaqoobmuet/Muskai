import type {
  CreateGenerationInput,
  GenerationDTO,
  LoginInput,
  ModelInfoDTO,
  RegisterInput,
  ReelDTO,
  UserDTO,
} from '@muskai/shared';

/** Browser-side API client. The browser only ever talks to the Express API —
 *  the DashScope key never leaves the server. Session state rides in an
 *  httpOnly cookie, so every call sends credentials. */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Turn a DTO file path ("/files/…") into an absolute URL. */
export function fileUrl(path: string | null): string | null {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code = 'REQUEST_FAILED';
    try {
      const body = (await res.json()) as { error?: { message?: string; code?: string } };
      if (body.error?.message) message = body.error.message;
      if (body.error?.code) code = body.error.code;
    } catch {
      // keep the default message
    }
    throw new ApiError(res.status, code, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  // --- session ---
  register: (input: RegisterInput) => post<{ user: UserDTO }>('/api/auth/register', input),
  login: (input: LoginInput) => post<{ user: UserDTO }>('/api/auth/login', input),
  logout: () => post<void>('/api/auth/logout'),
  me: () => request<{ user: UserDTO | null }>('/api/auth/me'),
  updateProfile: (input: { name?: string; bio?: string | null }) =>
    request<{ user: UserDTO }>('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),

  // --- my reels ---
  listGenerations: () => request<GenerationDTO[]>('/api/generations'),
  createGeneration: (input: CreateGenerationInput) =>
    post<GenerationDTO>('/api/generations', input),
  extendGeneration: (id: string) => post<GenerationDTO>(`/api/generations/${id}/extend`),
  deleteGeneration: (id: string) => request<void>(`/api/generations/${id}`, { method: 'DELETE' }),
  publishGeneration: (id: string, published: boolean) =>
    post<GenerationDTO>(`/api/generations/${id}/publish`, { published }),

  // --- community ---
  listReels: (params: { limit?: number; offset?: number; handle?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.offset) qs.set('offset', String(params.offset));
    if (params.handle) qs.set('handle', params.handle);
    const suffix = qs.toString();
    return request<ReelDTO[]>(`/api/reels${suffix ? `?${suffix}` : ''}`);
  },
  getReel: (id: string) => request<ReelDTO>(`/api/reels/${id}`),
  likeReel: (id: string) =>
    post<{ liked: boolean; likeCount: number }>(`/api/reels/${id}/like`),
  getProfile: (handle: string) =>
    request<{
      id: string;
      name: string;
      handle: string;
      bio: string | null;
      avatarUrl: string | null;
      createdAt: string;
      reelCount: number;
      totalLikes: number;
    }>(`/api/users/${handle}`),

  // --- models ---
  listModels: () => request<ModelInfoDTO[]>('/api/models'),
};
