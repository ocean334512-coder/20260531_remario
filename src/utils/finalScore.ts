/** 빠를수록 높은 시간 보너스 (최대 600점) */
export const TIME_BONUS_CAP_SEC = 600;

export type FinalScoreBreakdown = {
  gameScore: number;
  distanceM: number;
  elapsedMs: number;
  elapsedSec: number;
  timeBonus: number;
  totalScore: number;
};

export function computeFinalScore(
  gameScore: number,
  distanceM: number,
  elapsedMs: number,
): FinalScoreBreakdown {
  const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const timeBonus = Math.max(0, TIME_BONUS_CAP_SEC - elapsedSec);
  const totalScore = gameScore + distanceM + timeBonus;
  return {
    gameScore,
    distanceM,
    elapsedMs,
    elapsedSec,
    timeBonus,
    totalScore,
  };
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function formatLeaderboardScore(entry: {
  total_score: number;
  game_score: number;
  distance_m: number;
  time_bonus: number;
}): string {
  return `${entry.total_score}pt`;
}

export function formatLeaderboardDetail(entry: {
  game_score: number;
  distance_m: number;
  time_bonus: number;
}): string {
  return `S${entry.game_score}+${entry.distance_m}m+T${entry.time_bonus}`;
}
