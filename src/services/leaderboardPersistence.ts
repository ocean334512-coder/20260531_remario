import {
  prefetchGlobalLeaderboard,
  syncCacheToServerBackground,
} from './leaderboardApi';

let installed = false;

/** 탭 닫기·백그라운드 전에 로컬 순위를 서버로 밀어 넣기 */
export function installLeaderboardPersistence(): void {
  if (installed) return;
  installed = true;

  const flush = (): void => {
    syncCacheToServerBackground();
  };

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });
  window.addEventListener('pagehide', flush);
}

/** 게임 시작 전 전역 순위 미리 받기 (게임 시작 지연 최소화) */
export async function restoreLeaderboardOnBoot(waitMs = 5000): Promise<void> {
  syncCacheToServerBackground();

  await Promise.race([
    prefetchGlobalLeaderboard(),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, waitMs);
    }),
  ]);
}
