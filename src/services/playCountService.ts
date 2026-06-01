import Phaser from 'phaser';
import { STAGE1_ID } from '../constants/stage';
import {
  fetchPlayCountWithRetry,
  postPlayRecorded,
  syncPendingPlayCountWithRetry,
} from './playCountApi';
import {
  PLAY_COUNT_REGISTRY_KEY,
  addPendingIncrements,
  clearPendingIncrements,
  decrementPendingIncrements,
  getPendingPlayIncrements,
  getStoredPlayCount,
  incrementLocalPlayCount,
  mergePlayCount,
  setStoredPlayCount,
} from './playCountStore';

export function getRegistryPlayCount(registry: Phaser.Data.DataManager): number {
  const value = registry.get(PLAY_COUNT_REGISTRY_KEY);
  return typeof value === 'number' && value >= 0 ? value : getStoredPlayCount();
}

export function setRegistryPlayCount(
  registry: Phaser.Data.DataManager,
  count: number,
): void {
  const safe = Math.max(0, Math.floor(count));
  registry.set(PLAY_COUNT_REGISTRY_KEY, safe);
  setStoredPlayCount(safe);
}

function emitPlayCount(scene: Phaser.Scene, count: number): void {
  setRegistryPlayCount(scene.registry, count);
  scene.events.emit('play-count-changed', count);
}

/** 게임 시작·재시작마다 1회 호출 */
export function recordStagePlay(scene: Phaser.Scene, stageId = STAGE1_ID): void {
  const next = incrementLocalPlayCount();
  emitPlayCount(scene, next);
  addPendingIncrements(1);

  void (async () => {
    try {
      const serverCount = await postPlayRecorded(stageId);
      const merged = Math.max(next, serverCount);
      setRegistryPlayCount(scene.registry, merged);
      scene.events.emit('play-count-changed', merged);

      decrementPendingIncrements(1);
    } catch {
      /* 오프라인: pending에 이미 +1 반영됨, 부팅·visibility 시 동기화 */
    }
  })();
}

export async function restorePlayCountOnBoot(waitMs = 10_000): Promise<void> {
  const local = getStoredPlayCount();

  const restore = async (): Promise<void> => {
    let serverCount = local;
    try {
      serverCount = await fetchPlayCountWithRetry(STAGE1_ID);
    } catch {
      serverCount = local;
    }

    let display = mergePlayCount(serverCount);

    const pending = getPendingPlayIncrements();
    if (pending > 0) {
      const synced = await syncPendingPlayCountWithRetry(pending, STAGE1_ID);
      if (synced != null) {
        display = Math.max(display, synced);
        setStoredPlayCount(display);
        clearPendingIncrements();
      }
    }
  };

  await Promise.race([
    restore(),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, waitMs);
    }),
  ]);
}

export async function flushPendingPlayCount(registry: Phaser.Data.DataManager): Promise<void> {
  const pending = getPendingPlayIncrements();
  if (pending <= 0) return;

  const synced = await syncPendingPlayCountWithRetry(pending, STAGE1_ID, 3);
  if (synced != null) {
    const display = Math.max(getStoredPlayCount(), synced);
    setRegistryPlayCount(registry, display);
    clearPendingIncrements();
  }
}
