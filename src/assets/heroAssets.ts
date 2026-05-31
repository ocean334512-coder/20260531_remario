import Phaser from 'phaser';

const FW = 32;
const FH = 32;

const C = {
  hat: '#e52521',
  skin: '#ffcc99',
  overall: '#2244cc',
  shoe: '#4a2500',
  eye: '#111111',
  white: '#ffffff',
};

/** idle×2, run×6, jump, fall */
const POSES = [
  'idle1', 'idle2',
  'run1', 'run2', 'run3', 'run4', 'run5', 'run6',
  'jump', 'fall',
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
    ],
    frameRate: 3,
    repeat: -1,
  });

  scene.anims.create({
    key: 'hero-run',
    frames: scene.anims.generateFrameNumbers('hero', { start: 2, end: 7 }),
    frameRate: 14,
    repeat: -1,
  });

  scene.anims.create({
    key: 'hero-jump',
    frames: [{ key: 'hero', frame: 8 }],
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: 'hero-fall',
    frames: [{ key: 'hero', frame: 9 }],
    frameRate: 1,
    repeat: -1,
  });
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawHero(ctx: CanvasRenderingContext2D, ox: number, pose: Pose): void {
  ctx.clearRect(ox, 0, FW, FH);

  const runIndex = POSES.indexOf(pose) - 2;
  const isRun = runIndex >= 0 && runIndex < 6;
  const legShift = isRun ? Math.sin((runIndex / 6) * Math.PI * 2) * 3 : 0;
  const armShift = isRun ? Math.cos((runIndex / 6) * Math.PI * 2) * 2 : 0;
  const bob = pose === 'idle2' ? -1 : isRun && runIndex % 2 === 0 ? -1 : 0;
  const armUp = pose === 'jump';
  const armsOut = pose === 'fall';

  px(ctx, ox + 8, 2 + bob, 16, 6, C.hat);
  px(ctx, ox + 6, 6 + bob, 20, 3, C.hat);
  px(ctx, ox + 10, 9 + bob, 12, 8, C.skin);
  px(ctx, ox + 12, 12 + bob, 2, 2, C.eye);
  px(ctx, ox + 18, 12 + bob, 2, 2, C.eye);
  px(ctx, ox + 14, 15 + bob, 4, 1, C.skin);
  px(ctx, ox + 9, 17 + bob, 14, 8, C.overall);
  px(ctx, ox + 11, 17 + bob, 4, 4, C.hat);
  px(ctx, ox + 17, 17 + bob, 4, 4, C.hat);
  px(ctx, ox + 13, 21 + bob, 6, 2, C.white);

  if (armUp) {
    px(ctx, ox + 4, 12 + bob, 4, 9, C.skin);
    px(ctx, ox + 24, 12 + bob, 4, 9, C.skin);
  } else if (armsOut) {
    px(ctx, ox + 3, 18 + bob, 5, 3, C.skin);
    px(ctx, ox + 24, 18 + bob, 5, 3, C.skin);
  } else {
    px(ctx, ox + 6 + armShift, 18 + bob, 3, 6, C.skin);
    px(ctx, ox + 23 - armShift, 18 + bob, 3, 6, C.skin);
  }

  if (pose === 'jump') {
    px(ctx, ox + 11, 25 + bob, 4, 5, C.overall);
    px(ctx, ox + 17, 25 + bob, 4, 5, C.overall);
    px(ctx, ox + 10, 29 + bob, 6, 2, C.shoe);
    px(ctx, ox + 16, 29 + bob, 6, 2, C.shoe);
  } else if (pose === 'fall') {
    px(ctx, ox + 9, 26 + bob, 5, 4, C.overall);
    px(ctx, ox + 18, 26 + bob, 5, 4, C.overall);
    px(ctx, ox + 7, 29 + bob, 7, 2, C.shoe);
    px(ctx, ox + 18, 29 + bob, 7, 2, C.shoe);
  } else {
    px(ctx, ox + 10 + legShift, 25 + bob, 5, 5, C.overall);
    px(ctx, ox + 17 - legShift, 25 + bob, 5, 5, C.overall);
    px(ctx, ox + 9 + legShift, 29 + bob, 6, 2, C.shoe);
    px(ctx, ox + 17 - legShift, 29 + bob, 6, 2, C.shoe);
  }
}
