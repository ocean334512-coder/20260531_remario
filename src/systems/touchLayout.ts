export type TouchButton = { cx: number; cy: number; r: number };

export type TouchLayout = {
  portrait: boolean;
  leftBtn: TouchButton;
  rightBtn: TouchButton;
  jumpBtn: TouchButton;
};

/** 좌·우 이동 버튼이 겹치지 않도록 간격을 보장 */
export function computeTouchLayout(w: number, h: number): TouchLayout {
  const portrait = h > w;
  const margin = portrait ? 18 : 22;
  const edgeGap = portrait ? 18 : 14;

  const r = portrait ? Math.min(w * 0.11, 60) : Math.min(h * 0.13, 54);
  const jumpR = r * 1.08;
  const cy = h - r - (portrait ? 26 : 14);

  const leftCx = margin + r;
  const rightCx = leftCx + 2 * r + edgeGap;
  const moveRightEdge = rightCx + r;

  const jumpCx = Math.max(moveRightEdge + jumpR + edgeGap, w - jumpR - margin);

  return {
    portrait,
    leftBtn: { cx: leftCx, cy, r },
    rightBtn: { cx: rightCx, cy, r },
    jumpBtn: { cx: jumpCx, cy, r: jumpR },
  };
}
