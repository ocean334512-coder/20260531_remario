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

export function formatGameOverMessage(progressM: number, totalM: number): string {
  const pct = totalM > 0 ? Math.round((progressM / totalM) * 100) : 0;
  return `${progressM}m까지 진행!\n(전체 ${totalM}m · ${pct}%)`;
}
