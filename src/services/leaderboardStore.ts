import type { LeaderboardEntry } from './leaderboardApi';

const STORAGE_KEY = 'mario-leaderboard-cache-v2';
export const LEADERBOARD_SIZE = 10;

type CachedScore = {
  username: string;
  distance_m: number;
};

function usernameKey(username: string): string {
  return username.trim().toLowerCase();
}

function loadCacheMap(): Map<string, CachedScore> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as CachedScore[];
    if (!Array.isArray(parsed)) return new Map();
    const map = new Map<string, CachedScore>();
    for (const item of parsed) {
      if (!item?.username || typeof item.distance_m !== 'number') continue;
      const key = usernameKey(item.username);
      const prev = map.get(key);
      if (!prev || item.distance_m > prev.distance_m) {
        map.set(key, { username: item.username.trim(), distance_m: item.distance_m });
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function persistCache(map: Map<string, CachedScore>): void {
  const items = [...map.values()].sort(
    (a, b) => b.distance_m - a.distance_m || a.username.localeCompare(b.username),
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** 브라우저에 최고 기록 보관 (서버 리셋·오프라인 대비) */
export function cachePlayerScore(username: string, distanceM: number): void {
  const key = usernameKey(username);
  const map = loadCacheMap();
  const prev = map.get(key);
  if (!prev || distanceM > prev.distance_m) {
    map.set(key, { username: username.trim(), distance_m: distanceM });
    persistCache(map);
  }
}

/** 서버·로컬 캐시 병합 후 상위 N명 */
export function mergeLeaderboardEntries(
  serverEntries: LeaderboardEntry[],
  limit = LEADERBOARD_SIZE,
): LeaderboardEntry[] {
  const map = loadCacheMap();

  for (const entry of serverEntries) {
    const key = usernameKey(entry.username);
    const prev = map.get(key);
    if (!prev || entry.distance_m > prev.distance_m) {
      map.set(key, { username: entry.username, distance_m: entry.distance_m });
    }
  }

  persistCache(map);

  return [...map.values()]
    .sort((a, b) => b.distance_m - a.distance_m || a.username.localeCompare(b.username))
    .slice(0, limit)
    .map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      distance_m: entry.distance_m,
    }));
}

export type DisplayLeaderboardEntry = LeaderboardEntry & { empty?: boolean };

/** 항상 1~10위 슬롯 표시 (빈 자리는 —) */
export function padLeaderboardToTen(entries: LeaderboardEntry[]): DisplayLeaderboardEntry[] {
  const filled: DisplayLeaderboardEntry[] = entries.slice(0, LEADERBOARD_SIZE).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  while (filled.length < LEADERBOARD_SIZE) {
    filled.push({
      rank: filled.length + 1,
      username: '—',
      distance_m: 0,
      empty: true,
    });
  }

  return filled;
}

export function isSamePlayer(a: string, b: string): boolean {
  return usernameKey(a) === usernameKey(b);
}
