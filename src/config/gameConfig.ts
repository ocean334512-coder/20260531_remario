import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';

export const LANDSCAPE = { width: 960, height: 540 };
export const PORTRAIT = { width: 540, height: 960 };

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function prefersPortraitLayout(): boolean {
  return isTouchDevice() && window.innerHeight > window.innerWidth;
}

export function getGameSize(): { width: number; height: number } {
  return prefersPortraitLayout() ? PORTRAIT : LANDSCAPE;
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
