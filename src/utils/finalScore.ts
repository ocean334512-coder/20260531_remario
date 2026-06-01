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

type LeaderboardScoreFields = {
  total_score?: number;
  game_score?: number;
  distance_m?: number;
  time_bonus?: number;
  elapsed_sec?: number;
  elapsed_ms?: number;
};

/** 예전 저장 데이터·서버 누락 필드 보정 */
export function resolveLeaderboardTotal(entry: LeaderboardScoreFields): number {
  if (typeof entry.total_score === 'number' && Number.isFinite(entry.total_score)) {
    return Math.max(0, Math.floor(entry.total_score));
  }

  const gameScore = Math.max(0, Math.floor(Number(entry.game_score) || 0));
  const distanceM = Math.max(0, Math.floor(Number(entry.distance_m) || 0));

  let timeBonus = entry.time_bonus;
  if (typeof timeBonus !== 'number' || !Number.isFinite(timeBonus)) {
    const elapsedMs =
      typeof entry.elapsed_ms === 'number' && Number.isFinite(entry.elapsed_ms)
        ? entry.elapsed_ms
        : Math.max(0, Math.floor(Number(entry.elapsed_sec) || 0)) * 1000;
    timeBonus = Math.max(0, TIME_BONUS_CAP_SEC - Math.floor(elapsedMs / 1000));
  } else {
    timeBonus = Math.max(0, Math.floor(timeBonus));
  }

  return gameScore + distanceM + timeBonus;
}

export function formatLeaderboardScore(entry: LeaderboardScoreFields): string {
  return `${resolveLeaderboardTotal(entry).toLocaleString('ko-KR')}점`;
}
