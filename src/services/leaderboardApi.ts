import { apiUrl } from '../config/apiConfig';
import {
  buildOfflineLeaderboard,
  cachePlayerRun,
  getAllCachedRuns,
  ingestServerEntries,
  LEADERBOARD_SIZE,
  rankServerEntries,
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

export type LeaderboardFetchResult = {
  entries: LeaderboardEntry[];
  fromServer: boolean;
};

let prefetchedGlobal: LeaderboardEntry[] | null = null;

async function fetchWithTimeout(url: string, init: RequestInit, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

/** 로컬 기록을 서버로 (백그라운드) */
export async function syncCacheToServer(): Promise<void> {
  const items = getAllCachedRuns();
  if (items.length === 0) return;

  const res = await fetchWithTimeout(apiUrl('/api/scores/sync'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw new Error(`sync failed: ${res.status}`);
  }
}

export function syncCacheToServerBackground(): void {
  void syncCacheToServer().catch(() => {
    /* 다음 기회에 재시도 */
  });
}

/** 게임 시작 전 전역 순위 미리 받기 */
export async function prefetchGlobalLeaderboard(
  limit = LEADERBOARD_SIZE,
): Promise<LeaderboardEntry[]> {
  const result = await fetchGlobalLeaderboard(limit);
  if (result.fromServer) {
    prefetchedGlobal = result.entries;
  }
  return result.entries;
}

export function getPrefetchedLeaderboard(): LeaderboardEntry[] | null {
  return prefetchedGlobal;
}

export function clearPrefetchedLeaderboard(): void {
  prefetchedGlobal = null;
}

/** 전 세계 공통 순위 (서버 DB 기준) */
export async function fetchGlobalLeaderboard(
  limit = LEADERBOARD_SIZE,
): Promise<LeaderboardFetchResult> {
  try {
    const res = await fetchWithTimeout(
      apiUrl(`/api/scores/leaderboard?limit=${limit}`),
      { method: 'GET' },
      8000,
    );
    if (!res.ok) {
      throw new Error(`leaderboard failed: ${res.status}`);
    }
    const data = (await res.json()) as { items: LeaderboardEntry[] };
    const serverItems = data.items ?? [];
    ingestServerEntries(serverItems);
    const entries = rankServerEntries(serverItems);
    prefetchedGlobal = entries;
    return { entries, fromServer: true };
  } catch {
    return {
      entries: buildOfflineLeaderboard(limit),
      fromServer: false,
    };
  }
}

export async function submitScore(
  username: string,
  gameScore: number,
  distanceM: number,
  elapsedMs: number,
): Promise<void> {
  cachePlayerRun(username, gameScore, distanceM, elapsedMs);

  const res = await fetchWithTimeout(apiUrl('/api/scores'), {
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

export function fetchLeaderboardFromCache(limit = LEADERBOARD_SIZE): LeaderboardEntry[] {
  return buildOfflineLeaderboard(limit);
}

/** 저장 후 전역 순위 반환 (빠른 표시 → 서버 갱신) */
export async function submitAndFetchLeaderboard(
  username: string,
  gameScore: number,
  distanceM: number,
  elapsedMs: number,
  limit = LEADERBOARD_SIZE,
): Promise<LeaderboardFetchResult> {
  cachePlayerRun(username, gameScore, distanceM, elapsedMs);
  syncCacheToServerBackground();

  try {
    await submitScore(username, gameScore, distanceM, elapsedMs);
  } catch {
    /* 로컬 저장됨 */
  }

  return fetchGlobalLeaderboard(limit);
}
