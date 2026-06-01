export const TILE_SIZE = 32;

/** 현재 맵 폭 ~124 → 3배 */
export const STAGE_WIDTH = 372;

// . empty  # ground  - float  o coin  e walker  p platform-jumper  T thrower  H hopper  A airplane  f flag  S spawn
export const STAGE1: string[] = buildStage();

export const STAGE1_DECOR = buildDecor();

function buildStage(): string[] {
  const W = STAGE_WIDTH;
  const rows = Array.from({ length: 13 }, () => '.'.repeat(W));

  rows[0] = setAt(rows[0], W - 2, 'f');

  // 잔디 땅: 10칸 뭉치 + 5칸 구멍 (점프 가능)
  for (let x = 0; x < W - 12; x += 15) {
    rows[11] = fill(rows[11], x, x + 10, '#');
    rows[12] = fill(rows[12], x, x + 10, '#');
  }
  // 골 직전 연속 바닥
  rows[11] = fill(rows[11], W - 24, W - 2, '#');
  rows[12] = fill(rows[12], W - 24, W - 2, '#');

  rows[10] = setAt(rows[10], 4, 'S');

  // ── 구간별 발판 (막히던 중간 구간 포함) ──
  const bridges: Array<{ y: number; x: number; len: number }> = [
    { y: 9, x: 12, len: 5 },
    { y: 9, x: 28, len: 6 },
    { y: 8, x: 44, len: 5 },
    { y: 9, x: 58, len: 7 },
    { y: 7, x: 72, len: 5 },
    { y: 9, x: 88, len: 6 },
    { y: 8, x: 104, len: 5 },
    { y: 9, x: 118, len: 7 },
    { y: 7, x: 134, len: 6 },
    { y: 9, x: 150, len: 5 },
    { y: 8, x: 166, len: 7 },
    { y: 9, x: 182, len: 6 },
    { y: 7, x: 198, len: 5 },
    { y: 9, x: 214, len: 7 },
    { y: 8, x: 230, len: 6 },
    { y: 9, x: 246, len: 5 },
    { y: 7, x: 262, len: 7 },
    { y: 9, x: 278, len: 6 },
    { y: 8, x: 294, len: 5 },
    { y: 9, x: 310, len: 7 },
    { y: 7, x: 326, len: 6 },
    { y: 9, x: 342, len: 5 },
  ];
  bridges.forEach(({ y, x, len }) => {
    rows[y] = fill(rows[y], x, x + len, '-');
  });

  // 코인
  const coins = [18, 35, 52, 68, 85, 102, 120, 138, 155, 172, 190, 208, 225, 242, 260, 278, 295, 312, 330, 348];
  coins.forEach((x) => {
    rows[8] = setAt(rows[8], x, 'o');
  });

  // 초반: 발판 점프형(p) — 덜 위협적, 블럭 타고 접근
  const platformJumpers = [22, 48, 75, 108];
  platformJumpers.forEach((x) => {
    rows[10] = setAt(rows[10], x, 'p');
  });

  // 패트롤 적 (중·후반)
  const walkers = [142, 178, 215, 252, 265, 278, 292, 305, 318, 332, 345, 358];
  walkers.forEach((x) => {
    rows[10] = setAt(rows[10], x, 'e');
  });

  // 투사체 적 (초반 38 제거, 중·후반 집중)
  const throwers = [95, 160, 248, 268, 288, 308, 328, 348];
  throwers.forEach((x) => {
    rows[10] = setAt(rows[10], x, 'T');
  });

  // 깡총·비행기 — 스테이지 마지막 구간(x≥260)만
  const hoppers = [262, 282, 302, 322, 342];
  hoppers.forEach((x) => {
    rows[10] = setAt(rows[10], x, 'H');
  });

  const flyers: Array<{ x: number; y: number }> = [
    { x: 258, y: 4 },
    { x: 285, y: 3 },
    { x: 310, y: 5 },
    { x: 332, y: 4 },
    { x: 352, y: 3 },
  ];
  flyers.forEach(({ x, y }) => {
    rows[y] = setAt(rows[y], x, 'A');
  });

  return rows;
}

function buildDecor() {
  const items: Array<{
    kind: 'cloud' | 'cloudSmall' | 'tree' | 'bush';
    tx: number;
    ty: number;
  }> = [];

  for (let x = 6; x < STAGE_WIDTH; x += 18) {
    items.push({ kind: 'cloud', tx: x, ty: 1 + (x % 3) });
    items.push({ kind: 'cloudSmall', tx: x + 9, ty: 2 + (x % 2) });
  }
  for (let x = 4; x < STAGE_WIDTH; x += 14) {
    items.push({ kind: x % 28 === 4 ? 'tree' : 'bush', tx: x, ty: 10 });
  }

  return items;
}

function fill(row: string, x0: number, x1: number, ch: string): string {
  const chars = row.split('');
  for (let i = x0; i < x1 && i < chars.length; i += 1) {
    chars[i] = ch;
  }
  return chars.join('');
}

function setAt(row: string, x: number, ch: string): string {
  const chars = row.split('');
  if (x >= 0 && x < chars.length) chars[x] = ch;
  return chars.join('');
}

export function parseStage(rows: string[]) {
  const width = rows[0]?.length ?? 0;
  const height = rows.length;
  let spawnX = TILE_SIZE * 2;
  let spawnY = TILE_SIZE * 2;
  let flagX = (width - 3) * TILE_SIZE + TILE_SIZE / 2;
  let flagTopY = TILE_SIZE;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = rows[y]?.[x];
      if (cell === 'S') {
        spawnX = x * TILE_SIZE + TILE_SIZE / 2;
        spawnY = y * TILE_SIZE;
      }
      if (cell === 'f') {
        flagX = x * TILE_SIZE + TILE_SIZE / 2;
        flagTopY = y * TILE_SIZE + 16;
      }
    }
  }

  const groundRow = height - 2;
  return {
    width,
    height,
    spawnX,
    spawnY,
    groundRow,
    flagX,
    flagTopY,
    groundY: groundRow * TILE_SIZE,
  };
}
