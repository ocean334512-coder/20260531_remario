import { TILE_SIZE } from '../levels/stage1';

/** 타일 1칸 = 1m */
export function pixelsToMeters(px: number): number {
  return Math.round(px / TILE_SIZE);
}

export function clampProgressM(progressM: number, totalM: number): number {
  return Math.min(Math.max(0, progressM), totalM);
}

export function formatDistanceHud(progressM: number, totalM: number): string {
  return `${progressM}m / ${totalM}m`;
}

export function formatGameOverMessage(
  progressM: number,
  totalM: number,
  _gameScore: number,
  _timeBonus: number,
  totalScore: number,
): string {
  const pct = totalM > 0 ? Math.round((progressM / totalM) * 100) : 0;
  return `합산 ${totalScore.toLocaleString('ko-KR')}점 · ${progressM}m (${pct}%)`;
}

export function formatDeathPopupSub(final: boolean, totalM: number): string {
  return final ? `GAME OVER · 총 ${totalM}m` : '까지 진행했습니다';
}
