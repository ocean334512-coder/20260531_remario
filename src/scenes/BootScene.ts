import Phaser from 'phaser';
import { registerHeroAssets } from '../assets/heroAssets';
import { registerDecorAssets } from '../assets/decorAssets';
import { registerEnemyAssets } from '../assets/enemyAssets';
import { registerSkyAssets } from '../assets/skyAssets';
import { getStoredPlayCount, PLAY_COUNT_REGISTRY_KEY } from '../services/playCountStore';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    registerDecorAssets(this);
    registerSkyAssets(this);
    registerHeroAssets(this);
    registerEnemyAssets(this);
    this.makeCircleTexture('projectile', 10, 0xff6600, 0xcc3300);
  }

  create(): void {
    this.registry.set('score', 0);
    this.registry.set('lives', 3);
    this.registry.set(PLAY_COUNT_REGISTRY_KEY, getStoredPlayCount());
    this.scene.launch('UIScene');
    this.scene.start('GameScene');
  }

  private makeCircleTexture(
    key: string,
    radius: number,
    fill: number,
    border: number,
  ): void {
    const size = radius * 2;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(fill, 1);
    g.fillCircle(radius, radius, radius);
    g.lineStyle(2, border, 1);
    g.strokeCircle(radius, radius, radius - 1);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}
