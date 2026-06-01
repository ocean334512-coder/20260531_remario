import { apiUrl } from '../config/apiConfig';
import {
  cachePlayerRun,
  getAllCachedRuns,
  LEADERBOARD_SIZE,
  mergeLeaderboardEntries,
} from './leaderboardStore';

export type LeaderboardEntry = {
  rank: number;
  username: string;
  total_score: number;
  game_score: number;
  distance_m: number;
  elapsed_sec: number;
  time_bonus: number;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export async function syncCacheToServer(): Promise<void> {
  const items = getAllCachedRuns();
  if (items.length === 0) return;

  try {
    const res = await fetch(apiUrl('/api/scores/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      throw new Error(`sync failed: ${res.status}`);
    }
  } catch {
    /* ignore */
  }
}

export async function submitScore(
  username: string,
  gameScore: number,
  distanceM: number,
  elapsedMs: number,
): Promise<void> {
  cachePlayerRun(username, gameScore, distanceM, elapsedMs);

  const res = await fetch(apiUrl('/api/scores'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      game_score: gameScore,
      distance_m: distanceM,
      elapsed_ms: elapsedMs,
    }),
  });
  if (!res.ok) {
    throw new Error(`submit failed: ${res.status}`);
  }
}

export async function fetchLeaderboard(limit = LEADERBOARD_SIZE): Promise<LeaderboardEntry[]> {
  const res = await fetch(apiUrl(`/api/scores/leaderboard?limit=${limit}`));
  if (!res.ok) {
    throw new Error(`leaderboard failed: ${res.status}`);
  }
  const data = (await res.json()) as { items: LeaderboardEntry[] };
  return mergeLeaderboardEntries(data.items ?? [], limit);
}

export async function fetchLeaderboardWithRetry(
  limit = LEADERBOARD_SIZE,
  attempts = 3,
): Promise<LeaderboardEntry[]> {
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

export function fetchLeaderboardFromCache(limit = LEADERBOARD_SIZE): LeaderboardEntry[] {
  return mergeLeaderboardEntries([], limit);
}
