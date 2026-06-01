import Phaser from 'phaser';

const FW = 48;
const FH = 48;

const C = {
  hat: '#e52521',
  hatDark: '#b81818',
  skin: '#ffcc99',
  skinShadow: '#e8a86e',
  overall: '#2255dd',
  overallLight: '#5588ff',
  shoe: '#5c3010',
  eye: '#1a1a1a',
  cheek: '#ffaa99',
};

const POSES = [
  'idle1', 'idle2', 'idle3',
  'run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7', 'run8',
  'jump', 'fall', 'land',
] as const;

type Pose = (typeof POSES)[number];

export function registerHeroAssets(scene: Phaser.Scene): void {
  const count = POSES.length;
  const canvas = scene.textures.createCanvas('hero', FW * count, FH);
  if (!canvas) return;

  const ctx = canvas.context;
  POSES.forEach((pose, i) => {
    drawHero(ctx, i * FW, pose);
    canvas.add(i, 0, i * FW, 0, FW, FH);
  });
  canvas.refresh();

  scene.anims.create({
    key: 'hero-idle',
    frames: [
      { key: 'hero', frame: 0 },
      { key: 'hero', frame: 1 },
      { key: 'hero', frame: 2 },
      { key: 'hero', frame: 1 },
    ],
    frameRate: 6,
    repeat: -1,
  });

  scene.anims.create({
    key: 'hero-run',
    frames: scene.anims.generateFrameNumbers('hero', { start: 3, end: 10 }),
    frameRate: 16,
    repeat: -1,
  });

  scene.anims.create({
    key: 'hero-jump',
    frames: [{ key: 'hero', frame: 11 }],
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: 'hero-fall',
    frames: [{ key: 'hero', frame: 12 }],
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: 'hero-land',
    frames: [{ key: 'hero', frame: 13 }],
    frameRate: 1,
    repeat: 0,
  });
}

function round(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawHero(ctx: CanvasRenderingContext2D, ox: number, pose: Pose): void {
  ctx.clearRect(ox, 0, FW, FH);

  const runIndex = POSES.indexOf(pose) - 3;
  const isRun = runIndex >= 0 && runIndex < 8;
  const phase = isRun ? (runIndex / 8) * Math.PI * 2 : 0;
  const legSwing = isRun ? Math.sin(phase) * 4 : 0;
  const armSwing = isRun ? Math.cos(phase) * 3 : 0;
  const bob =
    pose === 'idle2' ? -1 : pose === 'idle3' ? -0.5 : isRun && runIndex % 2 === 0 ? -1.5 : 0;

  const hy = 10 + bob;
  const cx = ox + FW / 2;

  round(ctx, ox + 16, hy, 16, 6, 3, C.hatDark);
  round(ctx, ox + 15, hy - 1, 18, 7, 4, C.hat);

  circle(ctx, cx, hy + 10, 9, C.skin);
  circle(ctx, cx - 4, hy + 9, 1.8, C.eye);
  circle(ctx, cx + 4, hy + 9, 1.8, C.eye);
  circle(ctx, cx - 5, hy + 12, 1.5, C.cheek);
  circle(ctx, cx + 5, hy + 12, 1.5, C.cheek);

  round(ctx, ox + 17, hy + 17, 14, 12, 4, C.overall);
  round(ctx, ox + 19, hy + 19, 4, 5, 2, C.overallLight);
  round(ctx, ox + 25, hy + 19, 4, 5, 2, C.overallLight);

  if (pose === 'jump') {
    circle(ctx, ox + 14, hy + 16, 3, C.skin);
    circle(ctx, ox + 34, hy + 16, 3, C.skin);
    round(ctx, ox + 18, hy + 28, 5, 9, 2, C.overall);
    round(ctx, ox + 25, hy + 28, 5, 9, 2, C.overall);
    round(ctx, ox + 17, hy + 36, 7, 4, 2, C.shoe);
    round(ctx, ox + 24, hy + 36, 7, 4, 2, C.shoe);
  } else if (pose === 'fall') {
    round(ctx, ox + 12, hy + 20, 6, 3, 2, C.skin);
    round(ctx, ox + 30, hy + 20, 6, 3, 2, C.skin);
    round(ctx, ox + 17, hy + 28, 6, 7, 2, C.overall);
    round(ctx, ox + 25, hy + 28, 6, 7, 2, C.overall);
    round(ctx, ox + 16, hy + 34, 8, 4, 2, C.shoe);
    round(ctx, ox + 24, hy + 34, 8, 4, 2, C.shoe);
  } else if (pose === 'land') {
    round(ctx, ox + 17, hy + 30, 7, 5, 2, C.overall);
    round(ctx, ox + 24, hy + 30, 7, 5, 2, C.overall);
    round(ctx, ox + 16, hy + 34, 8, 4, 2, C.shoe);
    round(ctx, ox + 24, hy + 34, 8, 4, 2, C.shoe);
  } else {
    round(ctx, ox + 12 + armSwing, hy + 20, 4, 8, 2, C.skin);
    round(ctx, ox + 32 - armSwing, hy + 20, 4, 8, 2, C.skin);
    round(ctx, ox + 16 + legSwing, hy + 28, 6, 9, 3, C.overall);
    round(ctx, ox + 26 - legSwing, hy + 28, 6, 9, 3, C.overall);
    round(ctx, ox + 15 + legSwing, hy + 36, 7, 4, 2, C.shoe);
    round(ctx, ox + 26 - legSwing, hy + 36, 7, 4, 2, C.shoe);
  }
}
