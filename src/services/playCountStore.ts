import { STAGE1_ID } from '../constants/stage';

const COUNT_KEY = 'mario-stage1-play-count';
const PENDING_KEY = 'mario-stage1-play-pending';

function readNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeNumber(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
  } catch {
    /* ignore quota */
  }
}

export function getStoredPlayCount(): number {
  return readNumber(COUNT_KEY);
}

export function getPendingPlayIncrements(): number {
  return readNumber(PENDING_KEY);
}

export function setStoredPlayCount(count: number): void {
  writeNumber(COUNT_KEY, count);
}

export function addPendingIncrements(delta: number): void {
  if (delta <= 0) return;
  writeNumber(PENDING_KEY, getPendingPlayIncrements() + delta);
}

export function clearPendingIncrements(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    writeNumber(PENDING_KEY, 0);
  }
}

export function decrementPendingIncrements(delta = 1): void {
  if (delta <= 0) return;
  writeNumber(PENDING_KEY, Math.max(0, getPendingPlayIncrements() - delta));
}

export function mergePlayCount(serverCount: number): number {
  const local = getStoredPlayCount();
  const merged = Math.max(local, serverCount);
  setStoredPlayCount(merged);
  return merged;
}

export function incrementLocalPlayCount(): number {
  const next = getStoredPlayCount() + 1;
  setStoredPlayCount(next);
  return next;
}

export function formatPlayCountHud(count: number): string {
  return `플레이 ${count.toLocaleString('ko-KR')}회`;
}

export function formatLivesHud(lives: number): string {
  return `생명 (하트) : ${lives}`;
}

export const PLAY_COUNT_REGISTRY_KEY = `${STAGE1_ID}PlayCount`;
