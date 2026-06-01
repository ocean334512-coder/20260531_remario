import { syncCacheToServerWithRetry } from './leaderboardApi';

let installed = false;

/** 탭 닫기·백그라운드 전에 로컬 순위를 서버로 밀어 넣기 */
export function installLeaderboardPersistence(): void {
  if (installed) return;
  installed = true;

  const flush = (): void => {
    void syncCacheToServerWithRetry(3);
  };

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });
  window.addEventListener('pagehide', flush);
}

/** 게임 시작 전 로컬 기록을 서버에 복구 (최대 waitMs) */
export async function restoreLeaderboardOnBoot(waitMs = 12_000): Promise<void> {
  await Promise.race([
    syncCacheToServerWithRetry(5),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, waitMs);
    }),
  ]);
}
