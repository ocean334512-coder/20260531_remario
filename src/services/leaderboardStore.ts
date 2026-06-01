import type { LeaderboardEntry } from './leaderboardApi';
import { computeFinalScore } from '../utils/finalScore';

const STORAGE_KEY = 'mario-leaderboard-records';
const LEGACY_KEYS = ['mario-leaderboard-cache-v2', 'mario-leaderboard-cache-v1'];

export const LEADERBOARD_SIZE = 10;

export type RunRecord = {
  username: string;
  game_score: number;
  distance_m: number;
  elapsed_ms: number;
  time_bonus: number;
  total_score: number;
};

function usernameKey(username: string): string {
  return username.trim().toLowerCase();
}

function migrateLegacyStorage(): void {
  if (localStorage.getItem(STORAGE_KEY)) return;
  for (const legacyKey of LEGACY_KEYS) {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as Array<{ username: string; distance_m: number }>;
      if (!Array.isArray(parsed)) continue;
      const converted: RunRecord[] = parsed.map((item) => {
        const breakdown = computeFinalScore(0, item.distance_m, 0);
        return {
          username: item.username,
          game_score: breakdown.gameScore,
          distance_m: breakdown.distanceM,
          elapsed_ms: breakdown.elapsedMs,
          time_bonus: breakdown.timeBonus,
          total_score: breakdown.totalScore,
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(converted));
      return;
    } catch {
      /* try next */
    }
  }
}

export function loadCacheMap(): Map<string, RunRecord> {
  migrateLegacyStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as RunRecord[];
    if (!Array.isArray(parsed)) return new Map();
    const map = new Map<string, RunRecord>();
    for (const item of parsed) {
      if (!item?.username) continue;
      const key = usernameKey(item.username);
      const prev = map.get(key);
      if (!prev || item.total_score > prev.total_score) {
        map.set(key, item);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function persistCache(map: Map<string, RunRecord>): void {
  const items = [...map.values()].sort(
    (a, b) =>
      b.total_score - a.total_score ||
      a.elapsed_ms - b.elapsed_ms ||
      a.username.localeCompare(b.username),
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function cachePlayerRun(
  username: string,
  gameScore: number,
  distanceM: number,
  elapsedMs: number,
): RunRecord {
  const breakdown = computeFinalScore(gameScore, distanceM, elapsedMs);
  const record: RunRecord = {
    username: username.trim(),
    game_score: breakdown.gameScore,
    distance_m: breakdown.distanceM,
    elapsed_ms: breakdown.elapsedMs,
    time_bonus: breakdown.timeBonus,
    total_score: breakdown.totalScore,
  };
  const key = usernameKey(username);
  const map = loadCacheMap();
  const prev = map.get(key);
  if (!prev || record.total_score > prev.total_score) {
    map.set(key, record);
    persistCache(map);
  }
  return record;
}

export function getAllCachedRuns(): Array<{
  username: string;
  game_score: number;
  distance_m: number;
  elapsed_ms: number;
}> {
  return [...loadCacheMap().values()].map((r) => ({
    username: r.username,
    game_score: r.game_score,
    distance_m: r.distance_m,
    elapsed_ms: r.elapsed_ms,
  }));
}

export function mergeLeaderboardEntries(
  serverEntries: LeaderboardEntry[],
  limit = LEADERBOARD_SIZE,
): LeaderboardEntry[] {
  const map = loadCacheMap();

  for (const entry of serverEntries) {
    const key = usernameKey(entry.username);
    const record: RunRecord = {
      username: entry.username,
      game_score: entry.game_score,
      distance_m: entry.distance_m,
      elapsed_ms: entry.elapsed_sec * 1000,
      time_bonus: entry.time_bonus,
      total_score: entry.total_score,
    };
    const prev = map.get(key);
    if (!prev || record.total_score > prev.total_score) {
      map.set(key, record);
    }
  }

  persistCache(map);

  return [...map.values()]
    .sort(
      (a, b) =>
        b.total_score - a.total_score ||
        a.elapsed_ms - b.elapsed_ms ||
        a.username.localeCompare(b.username),
    )
    .slice(0, limit)
    .map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      total_score: entry.total_score,
      game_score: entry.game_score,
      distance_m: entry.distance_m,
      elapsed_sec: Math.floor(entry.elapsed_ms / 1000),
      time_bonus: entry.time_bonus,
    }));
}

export type DisplayLeaderboardEntry = LeaderboardEntry & { empty?: boolean };

export function padLeaderboardToTen(entries: LeaderboardEntry[]): DisplayLeaderboardEntry[] {
  const filled: DisplayLeaderboardEntry[] = entries.slice(0, LEADERBOARD_SIZE).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  while (filled.length < LEADERBOARD_SIZE) {
    filled.push({
      rank: filled.length + 1,
      username: '—',
      total_score: 0,
      game_score: 0,
      distance_m: 0,
      elapsed_sec: 0,
      time_bonus: 0,
      empty: true,
    });
  }

  return filled;
}

export function isSamePlayer(a: string, b: string): boolean {
  return usernameKey(a) === usernameKey(b);
}
