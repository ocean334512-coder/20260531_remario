import Phaser from 'phaser';
import { isTouchDevice } from '../config/gameConfig';
import { getTouchBarHeight } from './TouchControls';

const TERRAIN_COLORS: Record<string, number> = {
  '#': 0x6d4c2e,
  '-': 0x9e7b52,
  f: 0x4caf50,
  S: 0x42a5f5,
};

/** 좌측 하단 스테이지 미니맵 (지형 + 플레이어 + 카메라 뷰포트) */
export class Minimap {
  private readonly scene: Phaser.Scene;
  private readonly rows: string[];
  private readonly tileSize: number;
  private readonly worldWidth: number;
  private readonly worldHeight: number;

  private mapX = 0;
  private mapY = 0;
  private mapW = 0;
  private mapH = 0;

  private bg!: Phaser.GameObjects.Rectangle;
  private terrain!: Phaser.GameObjects.Graphics;
  private viewport!: Phaser.GameObjects.Graphics;
  private playerDot!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    rows: string[],
    tileSize: number,
    worldWidth: number,
    worldHeight: number,
  ) {
    this.scene = scene;
    this.rows = rows;
    this.tileSize = tileSize;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.layout();
    this.drawStatic();
    scene.scale.on('resize', this.onResize, this);
  }

  destroy(): void {
    this.scene.scale.off('resize', this.onResize, this);
    this.bg.destroy();
    this.terrain.destroy();
    this.viewport.destroy();
    this.playerDot.destroy();
    this.label.destroy();
  }

  private onResize = (): void => {
    this.layout();
    this.drawStatic();
  };

  private layout(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const portrait = h > w;

    this.mapW = portrait ? 136 : 152;
    this.mapH = portrait ? 38 : 34;
    this.mapX = 10;

    if (isTouchDevice()) {
      this.mapY = h - getTouchBarHeight() - this.mapH - 8;
    } else {
      this.mapY = h - this.mapH - 12;
    }
  }

  private drawStatic(): void {
    if (this.bg) {
      this.bg.destroy();
      this.terrain.destroy();
      this.viewport.destroy();
      this.playerDot.destroy();
      this.label.destroy();
    }

    const depth = 1500;
    const cx = this.mapX + this.mapW / 2;
    const cy = this.mapY + this.mapH / 2;

    this.bg = this.scene.add
      .rectangle(cx, cy, this.mapW + 4, this.mapH + 4, 0x000000, 0.6)
      .setScrollFactor(0)
      .setDepth(depth - 1)
      .setStrokeStyle(1, 0xffffff, 0.35);

    this.label = this.scene.add
      .text(this.mapX + 2, this.mapY - 14, 'MAP', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setScrollFactor(0)
      .setDepth(depth);

    this.terrain = this.scene.add.graphics().setScrollFactor(0).setDepth(depth);
    this.viewport = this.scene.add.graphics().setScrollFactor(0).setDepth(depth + 1);
    this.playerDot = this.scene.add.graphics().setScrollFactor(0).setDepth(depth + 2);

    this.drawTerrain();
  }

  private drawTerrain(): void {
    const width = this.rows[0]?.length ?? 0;
    const height = this.rows.length;
    const sx = this.mapW / this.worldWidth;
    const sy = this.mapH / this.worldHeight;

    this.terrain.clear();
    this.terrain.fillStyle(0x5c94fc, 0.35);
    this.terrain.fillRect(this.mapX, this.mapY, this.mapW, this.mapH);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const cell = this.rows[y]?.[x];
        const color = cell ? TERRAIN_COLORS[cell] : undefined;
        if (color === undefined) continue;

        this.terrain.fillStyle(color, 1);
        this.terrain.fillRect(
          this.mapX + x * this.tileSize * sx,
          this.mapY + y * this.tileSize * sy,
          Math.max(1, this.tileSize * sx),
          Math.max(1, this.tileSize * sy),
        );
      }
    }
  }

  updatePlayer(worldX: number, worldY: number, camera?: Phaser.Cameras.Scene2D.Camera): void {
    const sx = this.mapW / this.worldWidth;
    const sy = this.mapH / this.worldHeight;

    this.viewport.clear();
    if (camera) {
      this.viewport.lineStyle(1, 0xffffff, 0.45);
      this.viewport.strokeRect(
        this.mapX + camera.scrollX * sx,
        this.mapY + camera.scrollY * sy,
        camera.width * sx,
        camera.height * sy,
      );
    }

    const px = this.mapX + worldX * sx;
    const py = this.mapY + worldY * sy;

    this.playerDot.clear();
    this.playerDot.fillStyle(0xff1744, 1);
    this.playerDot.fillCircle(px, py, 3);
    this.playerDot.lineStyle(1, 0xffffff, 0.9);
    this.playerDot.strokeCircle(px, py, 3);
  }
}
