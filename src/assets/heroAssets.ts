import Phaser from 'phaser';

const FW = 48;
const FH = 48;

const POSES = [
  'idle1', 'idle2', 'idle3',
  'run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7', 'run8',
  'jump', 'fall', 'land',
] as const;

type Pose = (typeof POSES)[number];
type DrawHeroFn = (ctx: CanvasRenderingContext2D, ox: number, pose: Pose) => void;

export const HERO_TEXTURE_BOY = 'hero-boy';
export const HERO_TEXTURE_GIRL = 'hero-girl';

export function registerHeroAssets(scene: Phaser.Scene): void {
  registerCharacterSprites(scene, HERO_TEXTURE_BOY, drawBoyHero);
  registerCharacterSprites(scene, HERO_TEXTURE_GIRL, drawGirlHero);
}

function registerCharacterSprites(
  scene: Phaser.Scene,
  textureKey: string,
  drawFrame: DrawHeroFn,
): void {
  const count = POSES.length;
  const canvas = scene.textures.createCanvas(textureKey, FW * count, FH);
  if (!canvas) return;

  const ctx = canvas.context;
  POSES.forEach((pose, i) => {
    drawFrame(ctx, i * FW, pose);
    canvas.add(i, 0, i * FW, 0, FW, FH);
  });
  canvas.refresh();

  scene.anims.create({
    key: `${textureKey}-idle`,
    frames: [
      { key: textureKey, frame: 0 },
      { key: textureKey, frame: 1 },
      { key: textureKey, frame: 2 },
      { key: textureKey, frame: 1 },
    ],
    frameRate: 6,
    repeat: -1,
  });

  scene.anims.create({
    key: `${textureKey}-run`,
    frames: scene.anims.generateFrameNumbers(textureKey, { start: 3, end: 10 }),
    frameRate: 16,
    repeat: -1,
  });

  scene.anims.create({
    key: `${textureKey}-jump`,
    frames: [{ key: textureKey, frame: 11 }],
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: `${textureKey}-fall`,
    frames: [{ key: textureKey, frame: 12 }],
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: `${textureKey}-land`,
    frames: [{ key: textureKey, frame: 13 }],
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
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, h);
  }
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

function drawPoseBody(
  ctx: CanvasRenderingContext2D,
  ox: number,
  pose: Pose,
  drawParts: (hy: number, cx: number, legSwing: number, armSwing: number) => void,
): void {
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
  drawParts(hy, cx, legSwing, armSwing);
}

const BOY = {
  hat: '#e52521',
  hatDark: '#b81818',
  skin: '#ffcc99',
  overall: '#2255dd',
  overallLight: '#5588ff',
  shoe: '#5c3010',
  eye: '#1a1a1a',
  cheek: '#ffaa99',
};

function drawBoyHero(ctx: CanvasRenderingContext2D, ox: number, pose: Pose): void {
  drawPoseBody(ctx, ox, pose, (hy, cx, legSwing, armSwing) => {
    round(ctx, ox + 16, hy, 16, 6, 3, BOY.hatDark);
    round(ctx, ox + 15, hy - 1, 18, 7, 4, BOY.hat);

    circle(ctx, cx, hy + 10, 9, BOY.skin);
    circle(ctx, cx - 4, hy + 9, 1.8, BOY.eye);
    circle(ctx, cx + 4, hy + 9, 1.8, BOY.eye);
    circle(ctx, cx - 5, hy + 12, 1.5, BOY.cheek);
    circle(ctx, cx + 5, hy + 12, 1.5, BOY.cheek);

    round(ctx, ox + 17, hy + 17, 14, 12, 4, BOY.overall);
    round(ctx, ox + 19, hy + 19, 4, 5, 2, BOY.overallLight);
    round(ctx, ox + 25, hy + 19, 4, 5, 2, BOY.overallLight);

    drawBoyLimbs(ctx, ox, hy, pose, legSwing, armSwing);
  });
}

function drawBoyLimbs(
  ctx: CanvasRenderingContext2D,
  ox: number,
  hy: number,
  pose: Pose,
  legSwing: number,
  armSwing: number,
): void {
  if (pose === 'jump') {
    circle(ctx, ox + 14, hy + 16, 3, BOY.skin);
    circle(ctx, ox + 34, hy + 16, 3, BOY.skin);
    round(ctx, ox + 18, hy + 28, 5, 9, 2, BOY.overall);
    round(ctx, ox + 25, hy + 28, 5, 9, 2, BOY.overall);
    round(ctx, ox + 17, hy + 36, 7, 4, 2, BOY.shoe);
    round(ctx, ox + 24, hy + 36, 7, 4, 2, BOY.shoe);
  } else if (pose === 'fall') {
    round(ctx, ox + 12, hy + 20, 6, 3, 2, BOY.skin);
    round(ctx, ox + 30, hy + 20, 6, 3, 2, BOY.skin);
    round(ctx, ox + 17, hy + 28, 6, 7, 2, BOY.overall);
    round(ctx, ox + 25, hy + 28, 6, 7, 2, BOY.overall);
    round(ctx, ox + 16, hy + 34, 8, 4, 2, BOY.shoe);
    round(ctx, ox + 24, hy + 34, 8, 4, 2, BOY.shoe);
  } else if (pose === 'land') {
    round(ctx, ox + 17, hy + 30, 7, 5, 2, BOY.overall);
    round(ctx, ox + 24, hy + 30, 7, 5, 2, BOY.overall);
    round(ctx, ox + 16, hy + 34, 8, 4, 2, BOY.shoe);
    round(ctx, ox + 24, hy + 34, 8, 4, 2, BOY.shoe);
  } else {
    round(ctx, ox + 12 + armSwing, hy + 20, 4, 8, 2, BOY.skin);
    round(ctx, ox + 32 - armSwing, hy + 20, 4, 8, 2, BOY.skin);
    round(ctx, ox + 16 + legSwing, hy + 28, 6, 9, 3, BOY.overall);
    round(ctx, ox + 26 - legSwing, hy + 28, 6, 9, 3, BOY.overall);
    round(ctx, ox + 15 + legSwing, hy + 36, 7, 4, 2, BOY.shoe);
    round(ctx, ox + 26 - legSwing, hy + 36, 7, 4, 2, BOY.shoe);
  }
}

const GIRL = {
  hair: '#6b3a2a',
  hairLight: '#8b5240',
  bow: '#ff4d8d',
  bowLight: '#ff85b3',
  skin: '#ffcc99',
  dress: '#ff5c9a',
  dressLight: '#ff9ec4',
  shoe: '#d94a7a',
  eye: '#1a1a1a',
  cheek: '#ff9977',
};

function drawGirlHero(ctx: CanvasRenderingContext2D, ox: number, pose: Pose): void {
  drawPoseBody(ctx, ox, pose, (hy, cx, legSwing, armSwing) => {
    circle(ctx, ox + 11, hy + 8, 5, GIRL.hair);
    circle(ctx, ox + 35, hy + 8, 5, GIRL.hair);
    round(ctx, ox + 14, hy + 2, 20, 12, 6, GIRL.hairLight);

    round(ctx, ox + 17, hy + 1, 8, 5, 2, GIRL.bow);
    round(ctx, ox + 15, hy, 12, 4, 2, GIRL.bowLight);

    circle(ctx, cx, hy + 11, 8, GIRL.skin);
    circle(ctx, cx - 3.5, hy + 10, 1.6, GIRL.eye);
    circle(ctx, cx + 3.5, hy + 10, 1.6, GIRL.eye);
    circle(ctx, cx - 4, hy + 13, 1.4, GIRL.cheek);
    circle(ctx, cx + 4, hy + 13, 1.4, GIRL.cheek);

    round(ctx, ox + 18, hy + 18, 12, 11, 4, GIRL.dress);
    round(ctx, ox + 20, hy + 26, 8, 5, 2, GIRL.dressLight);

    drawGirlLimbs(ctx, ox, hy, pose, legSwing, armSwing);
  });
}

function drawGirlLimbs(
  ctx: CanvasRenderingContext2D,
  ox: number,
  hy: number,
  pose: Pose,
  legSwing: number,
  armSwing: number,
): void {
  if (pose === 'jump') {
    circle(ctx, ox + 13, hy + 17, 2.5, GIRL.skin);
    circle(ctx, ox + 33, hy + 17, 2.5, GIRL.skin);
    round(ctx, ox + 18, hy + 27, 5, 8, 2, GIRL.dress);
    round(ctx, ox + 25, hy + 27, 5, 8, 2, GIRL.dress);
    round(ctx, ox + 17, hy + 35, 6, 4, 2, GIRL.shoe);
    round(ctx, ox + 25, hy + 35, 6, 4, 2, GIRL.shoe);
  } else if (pose === 'fall') {
    round(ctx, ox + 11, hy + 21, 5, 3, 2, GIRL.skin);
    round(ctx, ox + 32, hy + 21, 5, 3, 2, GIRL.skin);
    round(ctx, ox + 17, hy + 28, 6, 6, 2, GIRL.dress);
    round(ctx, ox + 25, hy + 28, 6, 6, 2, GIRL.dress);
    round(ctx, ox + 16, hy + 34, 7, 4, 2, GIRL.shoe);
    round(ctx, ox + 24, hy + 34, 7, 4, 2, GIRL.shoe);
  } else if (pose === 'land') {
    round(ctx, ox + 17, hy + 29, 7, 5, 2, GIRL.dress);
    round(ctx, ox + 24, hy + 29, 7, 5, 2, GIRL.dress);
    round(ctx, ox + 16, hy + 34, 8, 4, 2, GIRL.shoe);
    round(ctx, ox + 24, hy + 34, 8, 4, 2, GIRL.shoe);
  } else {
    round(ctx, ox + 11 + armSwing, hy + 21, 3.5, 7, 2, GIRL.skin);
    round(ctx, ox + 33 - armSwing, hy + 21, 3.5, 7, 2, GIRL.skin);
    round(ctx, ox + 17 + legSwing, hy + 28, 5, 8, 3, GIRL.dress);
    round(ctx, ox + 26 - legSwing, hy + 28, 5, 8, 3, GIRL.dress);
    round(ctx, ox + 16 + legSwing, hy + 35, 6, 4, 2, GIRL.shoe);
    round(ctx, ox + 26 - legSwing, hy + 35, 6, 4, 2, GIRL.shoe);
  }
}
