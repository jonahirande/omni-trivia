import type {
  Category,
  GameMode,
  LeaderboardEntry,
  SubmitMatchPayload,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(body || `Request failed with status ${res.status}`, res.status);
  }

  // Some endpoints (e.g. POST /matches) may return 204 No Content.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  /** GET /categories?kids=false */
  getCategories(kids: boolean): Promise<Category[]> {
    return request<Category[]>(`/categories?kids=${kids}`);
  },

  /** GET /leaderboard?mode=quick_play&country= */
  getLeaderboard(mode: GameMode, country = ''): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams({ mode });
    if (country) params.set('country', country);
    return request<LeaderboardEntry[]>(`/leaderboard?${params.toString()}`);
  },

  /** POST /matches */
  submitMatch(payload: SubmitMatchPayload): Promise<void> {
    return request<void>('/matches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export { ApiError };
