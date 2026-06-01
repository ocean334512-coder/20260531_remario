import Phaser from 'phaser';

export type DecorKind = 'cloud' | 'cloudSmall' | 'tree' | 'bush' | 'hill';

export interface DecorItem {
  kind: DecorKind;
  tx: number;
  ty: number;
  parallax?: number;
}

export function registerDecorAssets(scene: Phaser.Scene): void {
  drawCloud(scene, 'cloud', 64, 32);
  drawCloud(scene, 'cloud-small', 40, 24);
  drawTree(scene);
  drawBush(scene);
  drawHill(scene);
  drawGrassGround(scene);
  registerCoinAnim(scene);
}

function drawCloud(scene: Phaser.Scene, key: string, w: number, h: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  const cx = w / 2;
  g.fillStyle(0xc8e4ff, 0.5);
  g.fillCircle(cx - 16, h - 10, 12);
  g.fillCircle(cx + 16, h - 10, 12);
  g.fillStyle(0xffffff, 0.92);
  g.fillCircle(cx - 14, h - 12, 10);
  g.fillCircle(cx, h - 17, 13);
  g.fillCircle(cx + 14, h - 12, 10);
  g.fillRoundedRect(cx - w / 2 + 6, h - 14, w - 12, 11, 6);
  g.generateTexture(key, w, h);
  g.destroy();
}

function drawTree(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x5c3a1e, 1);
  g.fillRect(22, 36, 12, 28);
  g.fillStyle(0x2d8a2d, 1);
  g.fillCircle(28, 24, 22);
  g.fillCircle(16, 30, 16);
  g.fillCircle(40, 30, 16);
  g.fillStyle(0x3aa83a, 1);
  g.fillCircle(28, 18, 14);
  g.generateTexture('tree', 56, 64);
  g.destroy();
}

function drawBush(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x2a7a2a, 1);
  g.fillCircle(16, 18, 14);
  g.fillCircle(30, 16, 12);
  g.fillCircle(44, 18, 14);
  g.generateTexture('bush', 60, 28);
  g.destroy();
}

function drawHill(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x3d9e50, 1);
  g.fillEllipse(80, 52, 168, 76);
  g.fillStyle(0x52b868, 0.85);
  g.fillEllipse(55, 54, 100, 50);
  g.fillStyle(0x68cc78, 0.5);
  g.fillEllipse(110, 48, 70, 38);
  g.generateTexture('hill', 160, 70);
  g.destroy();
}

function drawGrassGround(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xc84c0c, 1);
  g.fillRect(0, 8, 32, 24);
  g.fillStyle(0x40b040, 1);
  g.fillRect(0, 0, 32, 10);
  g.fillStyle(0x55cc55, 1);
  g.fillRect(2, 2, 4, 4);
  g.fillRect(12, 1, 5, 5);
  g.fillRect(22, 3, 4, 4);
  g.lineStyle(1, 0x8b2500, 1);
  g.strokeRect(0, 8, 32, 24);
  g.generateTexture('ground', 32, 32);
  g.destroy();
}

function registerCoinAnim(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  for (let i = 0; i < 4; i += 1) {
    const w = 8 + i * 3;
    g.fillStyle(0xffd700, 1);
    g.fillEllipse(8 + i * 16, 8, w, 14);
    g.lineStyle(1, 0xffaa00, 1);
    g.strokeEllipse(8 + i * 16, 8, w, 14);
  }
  g.generateTexture('coin-sheet', 64, 16);
  g.destroy();

  const tex = scene.textures.get('coin-sheet');
  for (let i = 0; i < 4; i += 1) {
    tex.add(String(i), 0, i * 16, 0, 16, 16);
  }

  scene.anims.create({
    key: 'coin-spin',
    frames: scene.anims.generateFrameNumbers('coin-sheet', { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1,
  });
}

export function spawnDecorations(
  scene: Phaser.Scene,
  items: DecorItem[],
  tileSize: number,
  groundRow: number,
): void {
  items.forEach((item) => {
    const x = item.tx * tileSize + tileSize / 2;
    const y = item.ty * tileSize + tileSize / 2;
    const depth = item.kind === 'hill' ? -20 : item.kind.includes('cloud') ? -5 : 4;
    const scroll = item.parallax ?? (item.kind === 'hill' ? 0.15 : item.kind.includes('cloud') ? 0.35 : 1);

    let sprite: Phaser.GameObjects.Image;
    if (item.kind === 'cloud') {
      sprite = scene.add.image(x, y, 'cloud');
    } else if (item.kind === 'cloudSmall') {
      sprite = scene.add.image(x, y, 'cloud-small');
    } else if (item.kind === 'tree') {
      sprite = scene.add.image(x, groundRow * tileSize - 8, 'tree');
      sprite.setOrigin(0.5, 1);
    } else if (item.kind === 'bush') {
      sprite = scene.add.image(x, groundRow * tileSize - 2, 'bush');
      sprite.setOrigin(0.5, 1);
    } else {
      sprite = scene.add.image(x, groundRow * tileSize + 10, 'hill');
      sprite.setOrigin(0.5, 1);
    }

    sprite.setDepth(depth);
    sprite.setScrollFactor(scroll);

    if (item.kind.includes('cloud')) {
      scene.tweens.add({
        targets: sprite,
        y: y + Phaser.Math.Between(-6, 6),
        duration: Phaser.Math.Between(2200, 3600),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  });
}

export function addBackgroundHills(scene: Phaser.Scene, worldWidth: number, groundY: number): void {
  const count = Math.ceil(worldWidth / 200) + 1;
  for (let i = 0; i < count; i += 1) {
    const hill = scene.add.image(i * 200 + 80, groundY + 6, 'hill');
    hill.setScrollFactor(0.1);
    hill.setDepth(-40);
    hill.setAlpha(0.9);
    hill.setTint(0x88c888);
  }
}
