import type { LeaderboardEntry } from './leaderboardApi';

/** 버전과 무관하게 유지되는 키 (SW/앱 업데이트 후에도 보존) */
const STORAGE_KEY = 'mario-leaderboard-records';
const LEGACY_KEYS = ['mario-leaderboard-cache-v2', 'mario-leaderboard-cache-v1'];

export const LEADERBOARD_SIZE = 10;

type CachedScore = {
  username: string;
  distance_m: number;
};

function usernameKey(username: string): string {
  return username.trim().toLowerCase();
}

function migrateLegacyStorage(): void {
  if (localStorage.getItem(STORAGE_KEY)) return;
  for (const legacyKey of LEGACY_KEYS) {
    const raw = localStorage.getItem(legacyKey);
    if (raw) {
      localStorage.setItem(STORAGE_KEY, raw);
      return;
    }
  }
}

export function loadCacheMap(): Map<string, CachedScore> {
  migrateLegacyStorage();
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

/** 브라우저에 최고 기록 보관 (서버 복구·오프라인 대비) */
export function cachePlayerScore(username: string, distanceM: number): void {
  const key = usernameKey(username);
  const map = loadCacheMap();
  const prev = map.get(key);
  if (!prev || distanceM > prev.distance_m) {
    map.set(key, { username: username.trim(), distance_m: distanceM });
    persistCache(map);
  }
}

/** 서버 동기화용 — 이 브라우저에 저장된 모든 기록 */
export function getAllCachedScores(): Array<{ username: string; distance_m: number }> {
  return [...loadCacheMap().values()];
}

/** 서버·로컬 병합 (기존 기록은 삭제하지 않음) */
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
