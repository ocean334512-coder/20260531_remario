import Phaser from 'phaser';

const FW = 48;
const FH = 48;

const C = {
  hat: '#e52521',
  hatDark: '#b81818',
  skin: '#ffcc99',
  skinShadow: '#e8a86e',
  overall: '#2255dd',
  overallLight: '#4477ff',
  overallDark: '#1a3d99',
  shoe: '#5c3010',
  glove: '#ffffff',
  eye: '#1a1a1a',
  cheek: '#ff9977',
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
  const legSwing = isRun ? Math.sin(phase) * 5 : 0;
  const armSwing = isRun ? Math.cos(phase) * 4 : 0;
  const bob =
    pose === 'idle2' ? -1.5 : pose === 'idle3' ? -0.5 : isRun && runIndex % 2 === 0 ? -2 : 0;
  const squash = pose === 'land' ? 1.15 : pose === 'jump' ? 0.92 : 1;
  const stretchY = pose === 'jump' ? 1.06 : pose === 'fall' ? 1.04 : 1 / squash;

  const cx = ox + FW / 2;
  const baseY = 8 + bob;

  ctx.save();
  ctx.translate(cx, FH / 2);
  ctx.scale(1, stretchY);
  ctx.translate(-cx, -FH / 2);

  const hy = baseY;

  round(ctx, ox + 14, hy + 2, 20, 7, 4, C.hatDark);
  round(ctx, ox + 12, hy, 24, 9, 5, C.hat);
  round(ctx, ox + 10, hy + 6, 28, 14, 7, C.skin);
  circle(ctx, ox + 18, hy + 12, 2.2, C.eye);
  circle(ctx, ox + 28, hy + 12, 2.2, C.eye);
  circle(ctx, ox + 16, hy + 16, 2, C.cheek);
  circle(ctx, ox + 30, hy + 16, 2, C.cheek);
  round(ctx, ox + 22, hy + 17, 4, 2, 1, C.skinShadow);

  round(ctx, ox + 12, hy + 18, 24, 14, 5, C.overall);
  round(ctx, ox + 14, hy + 20, 8, 8, 3, C.overallLight);
  round(ctx, ox + 26, hy + 20, 8, 8, 3, C.overallLight);
  round(ctx, ox + 18, hy + 28, 12, 4, 2, C.glove);

  if (pose === 'jump') {
    circle(ctx, ox + 10, hy + 14, 4, C.skin);
    circle(ctx, ox + 36, hy + 14, 4, C.skin);
    round(ctx, ox + 14, hy + 30, 8, 10, 3, C.overall);
    round(ctx, ox + 26, hy + 30, 8, 10, 3, C.overall);
    round(ctx, ox + 12, hy + 38, 10, 5, 2, C.shoe);
    round(ctx, ox + 26, hy + 38, 10, 5, 2, C.shoe);
  } else if (pose === 'fall') {
    round(ctx, ox + 6, hy + 22, 8, 4, 2, C.skin);
    round(ctx, ox + 34, hy + 22, 8, 4, 2, C.skin);
    round(ctx, ox + 12, hy + 30, 9, 8, 3, C.overall);
    round(ctx, ox + 27, hy + 30, 9, 8, 3, C.overall);
    round(ctx, ox + 10, hy + 36, 11, 5, 2, C.shoe);
    round(ctx, ox + 27, hy + 36, 11, 5, 2, C.shoe);
  } else if (pose === 'land') {
    round(ctx, ox + 11, hy + 32, 11, 6, 3, C.overallDark);
    round(ctx, ox + 26, hy + 32, 11, 6, 3, C.overallDark);
    round(ctx, ox + 9, hy + 36, 13, 5, 2, C.shoe);
    round(ctx, ox + 26, hy + 36, 13, 5, 2, C.shoe);
  } else {
    round(ctx, ox + 8 + armSwing, hy + 22, 6, 10, 3, C.skin);
    round(ctx, ox + 34 - armSwing, hy + 22, 6, 10, 3, C.skin);
    round(ctx, ox + 13 + legSwing, hy + 30, 9, 10, 4, C.overall);
    round(ctx, ox + 26 - legSwing, hy + 30, 9, 10, 4, C.overall);
    round(ctx, ox + 11 + legSwing, hy + 38, 11, 5, 2, C.shoe);
    round(ctx, ox + 26 - legSwing, hy + 38, 11, 5, 2, C.shoe);
  }

  ctx.restore();
}
