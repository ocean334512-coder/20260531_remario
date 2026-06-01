import Phaser from 'phaser';

/** 하늘·원경 텍스처 생성 */
export function registerSkyAssets(scene: Phaser.Scene): void {
  drawPuffCloud(scene, 'cloud-puff', 96, 44);
  drawPuffCloud(scene, 'cloud-puff-lg', 128, 56);
  drawMountain(scene, 'mountain-far', 240, 100);
  drawBird(scene);
}

function drawPuffCloud(scene: Phaser.Scene, key: string, w: number, h: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  const layers = [
    { alpha: 0.35, scale: 1.08, color: 0xd8ecff },
    { alpha: 0.55, scale: 1, color: 0xf0f8ff },
    { alpha: 0.95, scale: 0.92, color: 0xffffff },
  ];
  for (const layer of layers) {
    g.fillStyle(layer.color, layer.alpha);
    const cx = w / 2;
    const cy = h * 0.55;
    g.fillCircle(cx - 26 * layer.scale, cy, 16 * layer.scale);
    g.fillCircle(cx - 8 * layer.scale, cy - 8, 20 * layer.scale);
    g.fillCircle(cx + 14 * layer.scale, cy - 4, 18 * layer.scale);
    g.fillCircle(cx + 30 * layer.scale, cy + 2, 14 * layer.scale);
    g.fillRoundedRect(cx - w * 0.38, cy - 6, w * 0.76, h * 0.42, 12);
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

function drawMountain(scene: Phaser.Scene, key: string, w: number, h: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x6ba3d4, 0.45);
  g.fillTriangle(w * 0.08, h, w * 0.42, h * 0.18, w * 0.78, h);
  g.fillStyle(0x8fc5e8, 0.55);
  g.fillTriangle(w * 0.28, h, w * 0.55, h * 0.32, w * 0.92, h);
  g.fillStyle(0xa8d8f0, 0.35);
  g.fillTriangle(0, h, w * 0.22, h * 0.55, w * 0.48, h);
  g.generateTexture(key, w, h);
  g.destroy();
}

function drawBird(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.lineStyle(2, 0x2a3a55, 0.75);
  g.lineBetween(2, 8, 8, 3);
  g.lineBetween(8, 3, 12, 8);
  g.lineBetween(12, 8, 18, 3);
  g.lineBetween(18, 3, 22, 8);
  g.generateTexture('bird', 24, 12);
  g.destroy();
}
