import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';
import { getViewportSize } from '../utils/viewport';

/** PC·가로 플레이 기준 해상도 */
export const LANDSCAPE = { width: 960, height: 540 };

const MOBILE_MIN_WIDTH = 320;
const MOBILE_MIN_HEIGHT = 280;

/** 모바일(터치) 기기 여부 — 여러 신호를 함께 확인 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return true;
  try {
    if (window.matchMedia('(pointer: coarse)').matches) return true;
    if (window.matchMedia('(hover: none)').matches) return true;
  } catch {
    /* ignore */
  }
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

export function isPortraitViewport(): boolean {
  const { width, height } = getViewportSize();
  return height >= width;
}

export function getMobileGameSize(): { width: number; height: number } {
  const { width, height } = getViewportSize();
  return {
    width: Math.max(MOBILE_MIN_WIDTH, width),
    height: Math.max(MOBILE_MIN_HEIGHT, height),
  };
}

export function applyMobileDocumentClass(): void {
  document.documentElement.classList.toggle('is-mobile', isTouchDevice());
  document.documentElement.classList.toggle(
    'is-portrait',
    isTouchDevice() && isPortraitViewport(),
  );
  document.documentElement.classList.toggle(
    'is-landscape',
    isTouchDevice() && !isPortraitViewport(),
  );
}

/** 이름 입력 후 호출 — 그 시점의 실제 화면 크기 사용 */
export function buildGameConfig(): Phaser.Types.Core.GameConfig {
  const mobile = isTouchDevice();

  if (mobile) {
    const { width, height } = getMobileGameSize();
    return {
      type: Phaser.AUTO,
      width,
      height,
      parent: 'app',
      backgroundColor: '#6eb5f0',
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 520 },
          debug: false,
        },
      },
      scene: [BootScene, GameScene, UIScene],
    };
  }

  return {
    type: Phaser.AUTO,
    width: LANDSCAPE.width,
    height: LANDSCAPE.height,
    parent: 'app',
    backgroundColor: '#6eb5f0',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 520 },
        debug: false,
      },
    },
    scene: [BootScene, GameScene, UIScene],
  };
}

/** 회전·주소창·safe-area 변화 시 (모바일 RESIZE / PC refresh) */
export function syncGameDimensions(game: Phaser.Game): void {
  applyMobileDocumentClass();

  if (!isTouchDevice()) {
    game.scale.refresh();
    return;
  }

  const { width, height } = getMobileGameSize();
  if (game.scale.width !== width || game.scale.height !== height) {
    game.scale.resize(width, height);
  }
  game.scale.refresh();
}
