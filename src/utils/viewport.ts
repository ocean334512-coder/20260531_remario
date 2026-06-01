/** 모바일 브라우저에서 innerWidth/innerHeight가 회전 직후 늦게 바뀌는 문제 대응 */
export function getViewportSize(): { width: number; height: number } {
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width ?? window.innerWidth),
    height: Math.round(vv?.height ?? window.innerHeight),
  };
}

export function isLandscapeViewport(): boolean {
  const orientationType = screen.orientation?.type;
  if (orientationType?.startsWith('landscape')) return true;
  if (orientationType?.startsWith('portrait')) return false;
  if (window.matchMedia('(orientation: landscape)').matches) return true;
  if (window.matchMedia('(orientation: portrait)').matches) return false;

  const { width, height } = getViewportSize();
  return width > height;
}
