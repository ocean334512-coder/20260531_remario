import { apiUrl } from '../config/apiConfig';
import {
  cachePlayerScore,
  getAllCachedScores,
  LEADERBOARD_SIZE,
  mergeLeaderboardEntries,
} from './leaderboardStore';

export type LeaderboardEntry = {
  rank: number;
  username: string;
  distance_m: number;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

/** 게임 시작 시 로컬 기록을 서버로 보내 복구 (배포 후 DB 초기화 대비) */
export async function syncCacheToServer(): Promise<void> {
  const items = getAllCachedScores();
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
    // 서버 슬립·오프라인 — 무시 (게임은 계속)
  }
}

export async function submitScore(username: string, distanceM: number): Promise<void> {
  cachePlayerScore(username, distanceM);

  const res = await fetch(apiUrl('/api/scores'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, distance_m: distanceM }),
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
  const serverItems = data.items ?? [];
  return mergeLeaderboardEntries(serverItems, limit);
}

/** Render 무료 플랜 슬립 대비 재시도 */
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

/** API 실패 시 로컬 캐시만으로 순위표 구성 */
export function fetchLeaderboardFromCache(limit = LEADERBOARD_SIZE): LeaderboardEntry[] {
  return mergeLeaderboardEntries([], limit);
}
