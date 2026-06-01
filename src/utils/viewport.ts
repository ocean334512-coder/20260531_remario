/** 모바일 브라우저 실제 보이는 영역 (주소창·회전 반영) */
export function getViewportSize(): { width: number; height: number } {
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width ?? window.innerWidth),
    height: Math.round(vv?.height ?? window.innerHeight),
  };
}
