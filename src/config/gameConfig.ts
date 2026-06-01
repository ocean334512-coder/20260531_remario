import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';
import { getViewportSize } from '../utils/viewport';

export const LANDSCAPE = { width: 960, height: 540 };

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function getGameSize(): { width: number; height: number } {
  if (isTouchDevice()) {
    const { width, height } = getViewportSize();
    return {
      width: Math.max(320, width),
      height: Math.max(400, height),
    };
  }
  return LANDSCAPE;
}

const initialSize = getGameSize();
export let GAME_WIDTH = initialSize.width;
export let GAME_HEIGHT = initialSize.height;

export function syncGameDimensions(game: Phaser.Game): void {
  const size = getGameSize();
  GAME_WIDTH = size.width;
  GAME_HEIGHT = size.height;
  if (game.scale.width !== size.width || game.scale.height !== size.height) {
    game.scale.resize(size.width, size.height);
    game.scale.refresh();
  }
}

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: initialSize.width,
  height: initialSize.height,
  parent: 'app',
  backgroundColor: '#5c94fc',
  pixelArt: true,
  scale: {
    mode: isTouchDevice() ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
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
