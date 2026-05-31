import { apiUrl } from '../config/apiConfig';

export type LeaderboardEntry = {
  rank: number;
  username: string;
  distance_m: number;
};

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
