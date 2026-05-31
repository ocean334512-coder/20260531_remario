import Phaser from 'phaser';

const FW = 32;
const FH = 32;

export function registerEnemyAssets(scene: Phaser.Scene): void {
  registerGoomba(scene);
  registerKoopa(scene);
  registerHopper(scene);
  registerAirplane(scene);
  registerFlagPole(scene);
}

function registerGoomba(scene: Phaser.Scene): void {
  const frames = 4;
  const canvas = scene.textures.createCanvas('goomba', FW * frames, FH);
  if (!canvas) return;

  const ctx = canvas.context;
  for (let i = 0; i < frames; i += 1) {
    drawGoomba(ctx, i * FW, i);
    canvas.add(i, 0, i * FW, 0, FW, FH);
  }
  canvas.refresh();

  scene.anims.create({
    key: 'goomba-walk',
    frames: scene.anims.generateFrameNumbers('goomba', { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1,
  });
}

function registerKoopa(scene: Phaser.Scene): void {
  const walkFrames = 4;
  const throwFrames = 2;
  const total = walkFrames + throwFrames;
  const canvas = scene.textures.createCanvas('koopa', FW * total, FH);
  if (!canvas) return;

  const ctx = canvas.context;
  for (let i = 0; i < walkFrames; i += 1) {
    drawKoopa(ctx, i * FW, i, false);
    canvas.add(i, 0, i * FW, 0, FW, FH);
  }
  for (let i = 0; i < throwFrames; i += 1) {
    const idx = walkFrames + i;
    drawKoopa(ctx, idx * FW, i, true);
    canvas.add(idx, 0, idx * FW, 0, FW, FH);
  }
  canvas.refresh();

  scene.anims.create({
    key: 'koopa-walk',
    frames: scene.anims.generateFrameNumbers('koopa', { start: 0, end: 3 }),
    frameRate: 9,
    repeat: -1,
  });

  scene.anims.create({
    key: 'koopa-throw',
    frames: scene.anims.generateFrameNumbers('koopa', { start: 4, end: 5 }),
    frameRate: 6,
    repeat: 0,
  });
}

function registerHopper(scene: Phaser.Scene): void {
  const canvas = scene.textures.createCanvas('hopper', FW * 3, FH);
  if (!canvas) return;

  const ctx = canvas.context;
  drawHopper(ctx, 0, 'idle');
  canvas.add(0, 0, 0, 0, FW, FH);
  drawHopper(ctx, FW, 'idle');
  canvas.add(1, 0, FW, 0, FW, FH);
  drawHopper(ctx, FW * 2, 'jump');
  canvas.add(2, 0, FW * 2, 0, FW, FH);
  canvas.refresh();

  scene.anims.create({
    key: 'hopper-idle',
    frames: scene.anims.generateFrameNumbers('hopper', { start: 0, end: 1 }),
    frameRate: 6,
    repeat: -1,
  });
  scene.anims.create({
    key: 'hopper-jump',
    frames: [{ key: 'hopper', frame: 2 }],
    frameRate: 1,
    repeat: 0,
  });
}

function registerAirplane(scene: Phaser.Scene): void {
  const frames = 4;
  const canvas = scene.textures.createCanvas('airplane', FW * frames, FH);
  if (!canvas) return;

  const ctx = canvas.context;
  for (let i = 0; i < frames; i += 1) {
    drawAirplane(ctx, i * FW, i);
    canvas.add(i, 0, i * FW, 0, FW, FH);
  }
  canvas.refresh();

  scene.anims.create({
    key: 'airplane-fly',
    frames: scene.anims.generateFrameNumbers('airplane', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  const mg = scene.make.graphics({ x: 0, y: 0 });
  mg.fillStyle(0xff2222, 1);
  mg.fillRect(0, 2, 14, 4);
  mg.fillStyle(0xffaa00, 1);
  mg.fillRect(12, 3, 4, 2);
  mg.generateTexture('missile', 16, 8);
  mg.destroy();
}

function registerFlagPole(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xeeeeee, 1);
  g.fillRect(14, 0, 4, 48);
  g.fillStyle(0xcccccc, 1);
  g.fillRect(15, 0, 2, 48);
  g.generateTexture('flag-pole', 32, 48);
  g.destroy();

  const fg = scene.make.graphics({ x: 0, y: 0 });
  fg.fillStyle(0x00aa00, 1);
  fg.fillRect(0, 4, 28, 18);
  fg.fillStyle(0x008800, 1);
  fg.fillRect(2, 6, 24, 14);
  fg.fillStyle(0xffffff, 1);
  fg.fillCircle(6, 12, 3);
  fg.generateTexture('flag-cloth', 28, 22);
  fg.destroy();
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

function drawGoomba(ctx: CanvasRenderingContext2D, ox: number, frame: number): void {
  ctx.clearRect(ox, 0, FW, FH);
  const step = frame % 2 === 0 ? 0 : 1;

  px(ctx, ox + 8, 14, 16, 12, '#8b4513');
  px(ctx, ox + 6, 10, 20, 8, '#a0522d');
  px(ctx, ox + 4, 6, 8, 6, '#a0522d');
  px(ctx, ox + 20, 6, 8, 6, '#a0522d');
  px(ctx, ox + 10, 12, 4, 4, '#111111');
  px(ctx, ox + 18, 12, 4, 4, '#111111');
  px(ctx, ox + 13, 18, 6, 2, '#5c2e0a');
  px(ctx, ox + 8 + step, 26, 6, 4, '#4a2500');
  px(ctx, ox + 18 - step, 26, 6, 4, '#4a2500');
}

function drawHopper(
  ctx: CanvasRenderingContext2D,
  ox: number,
  pose: 'idle' | 'jump',
): void {
  ctx.clearRect(ox, 0, FW, FH);
  const squash = pose === 'jump' ? -4 : 0;

  px(ctx, ox + 8, 14 + squash, 16, 12, '#8844cc');
  px(ctx, ox + 10, 8 + squash, 12, 8, '#aa66ee');
  px(ctx, ox + 12, 10 + squash, 3, 3, '#111111');
  px(ctx, ox + 18, 10 + squash, 3, 3, '#111111');
  px(ctx, ox + 14, 16 + squash, 4, 2, '#6622aa');
  if (pose === 'jump') {
    px(ctx, ox + 6, 22, 6, 4, '#6622aa');
    px(ctx, ox + 20, 22, 6, 4, '#6622aa');
  } else {
    px(ctx, ox + 8, 26, 5, 3, '#6622aa');
    px(ctx, ox + 19, 26, 5, 3, '#6622aa');
  }
}

function drawAirplane(ctx: CanvasRenderingContext2D, ox: number, frame: number): void {
  ctx.clearRect(ox, 0, FW, FH);
  const wing = frame % 2 === 0 ? 0 : 2;

  px(ctx, ox + 4, 14 + wing, 22, 4, '#cccccc');
  px(ctx, ox + 8, 10, 14, 6, '#888888');
  px(ctx, ox + 22, 12, 6, 4, '#ff4444');
  px(ctx, ox + 2, 12 + wing, 8, 3, '#aaaaaa');
  px(ctx, ox + 14, 8 - wing, 4, 3, '#666666');
  px(ctx, ox + 6, 16, 3, 2, '#333333');
}

function drawKoopa(
  ctx: CanvasRenderingContext2D,
  ox: number,
  frame: number,
  throwing: boolean,
): void {
  ctx.clearRect(ox, 0, FW, FH);
  const step = frame % 2 === 0 ? 0 : 1;

  px(ctx, ox + 6, 18, 20, 10, '#2d8a2d');
  px(ctx, ox + 8, 12, 16, 8, '#3aa83a');
  px(ctx, ox + 10, 8, 12, 6, '#ffd700');
  px(ctx, ox + 12, 10, 3, 3, '#111111');
  px(ctx, ox + 18, 10, 3, 3, '#111111');

  if (throwing) {
    px(ctx, ox + 2, 14, 5, 4, '#ffcc99');
    px(ctx, ox + 25, 10, 5, 4, '#ffcc99');
  } else {
    px(ctx, ox + 4 + step, 20, 4, 6, '#ffcc99');
    px(ctx, ox + 24 - step, 20, 4, 6, '#ffcc99');
    px(ctx, ox + 8 + step, 27, 6, 3, '#1a5c1a');
    px(ctx, ox + 18 - step, 27, 6, 3, '#1a5c1a');
  }
}
