import { hideLeaderboard } from './leaderboardUi';

let exitWaiter: (() => void) | null = null;

export function waitForGameExit(): Promise<void> {
  return new Promise((resolve) => {
    exitWaiter = resolve;
  });
}

export function showExitButton(): void {
  const btn = document.getElementById('game-exit');
  if (btn) btn.hidden = false;
}

export function hideExitButton(): void {
  const btn = document.getElementById('game-exit');
  if (btn) btn.hidden = true;
}

export function bindExitButton(): void {
  const btn = document.getElementById('game-exit');
  if (!btn || btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';

  btn.addEventListener('click', () => {
    requestExitToTitle();
  });
}

export function requestExitToTitle(): void {
  const ok = window.confirm(
    '게임을 종료하고 처음 화면으로 돌아갈까요?\n(브라우저 밖으로 나가지 않습니다)',
  );
  if (!ok) return;

  hideLeaderboard();
  hideExitButton();

  const touchRoot = document.getElementById('touch-controls');
  if (touchRoot) touchRoot.hidden = true;

  const overlay = document.getElementById('name-entry');
  overlay?.classList.remove('name-entry--hidden');

  exitWaiter?.();
  exitWaiter = null;
}

export function teardownGameChrome(): void {
  hideExitButton();
  hideLeaderboard();
  const touchRoot = document.getElementById('touch-controls');
  if (touchRoot) touchRoot.hidden = true;
}
