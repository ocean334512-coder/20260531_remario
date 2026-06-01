import { isTouchDevice } from '../config/gameConfig';

const EDGE_PX = 28;

function isInteractiveUi(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    '.touch-controls, .touch-controls__btn, .game-exit, .leaderboard-panel, .name-entry',
  );
}

let touchStartX = 0;
let touchStartY = 0;
let touchTarget: EventTarget | null = null;
let installed = false;
let popStateHandler: (() => void) | null = null;
let touchStartHandler: ((e: TouchEvent) => void) | null = null;
let touchMoveHandler: ((e: TouchEvent) => void) | null = null;

function onTouchStart(e: TouchEvent): void {
  if (e.touches.length !== 1) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchTarget = e.target;
}

function onTouchMove(e: TouchEvent): void {
  if (e.touches.length !== 1) return;
  if (isInteractiveUi(touchTarget) || isInteractiveUi(e.target)) return;

  const x = e.touches[0].clientX;
  const y = e.touches[0].clientY;
  const dx = x - touchStartX;
  const dy = y - touchStartY;

  if (Math.abs(dx) < 8) return;
  if (Math.abs(dx) < Math.abs(dy)) return;

  const fromLeftEdge = touchStartX <= EDGE_PX;
  const fromRightEdge = touchStartX >= window.innerWidth - EDGE_PX;

  if ((fromLeftEdge && dx > 0) || (fromRightEdge && dx < 0) || Math.abs(dx) > 24) {
    e.preventDefault();
  }
}

function trapHistory(): void {
  history.pushState({ marioGame: true }, '', location.href);
}

/** iOS Safari 뒤로가기·가로 스와이프 이탈 완화 */
export function installNavigationGuard(): () => void {
  if (!isTouchDevice()) {
    return () => {};
  }
  installed = true;

  trapHistory();
  popStateHandler = () => {
    trapHistory();
  };
  window.addEventListener('popstate', popStateHandler);

  touchStartHandler = onTouchStart;
  touchMoveHandler = onTouchMove;
  document.addEventListener('touchstart', touchStartHandler, { passive: true });
  document.addEventListener('touchmove', touchMoveHandler, { passive: false });

  document.documentElement.classList.add('game-guard-active');

  return () => {
    if (!installed) return;
    installed = false;
    if (popStateHandler) {
      window.removeEventListener('popstate', popStateHandler);
      popStateHandler = null;
    }
    if (touchStartHandler) {
      document.removeEventListener('touchstart', touchStartHandler);
      touchStartHandler = null;
    }
    if (touchMoveHandler) {
      document.removeEventListener('touchmove', touchMoveHandler);
      touchMoveHandler = null;
    }
    document.documentElement.classList.remove('game-guard-active');
  };
}
