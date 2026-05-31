import { apiUrl } from '../config/apiConfig';

export type LeaderboardEntry = {
  rank: number;
  username: string;
  distance_m: number;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export async function submitScore(username: string, distanceM: number): Promise<void> {
  const res = await fetch(apiUrl('/api/scores'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, distance_m: distanceM }),
  });
  if (!res.ok) {
    throw new Error(`submit failed: ${res.status}`);
  }
}

export async function fetchLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const res = await fetch(apiUrl(`/api/scores/leaderboard?limit=${limit}`));
  if (!res.ok) {
    throw new Error(`leaderboard failed: ${res.status}`);
  }
  const data = (await res.json()) as { items: LeaderboardEntry[] };
  return data.items ?? [];
}

/** Render 무료 플랜 슬립 대비 재시도 */
export async function fetchLeaderboardWithRetry(limit = 10, attempts = 3): Promise<LeaderboardEntry[]> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetchLeaderboard(limit);
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await sleep(4000);
    }
  }
  throw lastError;
}
