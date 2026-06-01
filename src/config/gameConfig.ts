import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';

/** 게임 월드 해상도 (모바일·PC 공통, FIT으로 화면에 맞춤) */
export const LANDSCAPE = { width: 960, height: 540 };

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function buildGameConfig(): Phaser.Types.Core.GameConfig {
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

/** 회전·주소창 변화 후 레이아웃 재계산 */
export function syncGameDimensions(game: Phaser.Game): void {
  game.scale.refresh();
}
