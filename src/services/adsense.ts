const AD_CLIENT = 'ca-pub-3913568961670725';

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

/** index.html에 로드된 adsbygoogle 슬롯 초기화 */
export function refreshAdSenseSlots(): void {
  const slots = document.querySelectorAll<HTMLElement>('ins.adsbygoogle');
  if (slots.length === 0) return;

  for (let i = 0; i < slots.length; i += 1) {
    const el = slots[i];
    if (el.dataset.adsenseFilled === '1') continue;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      el.dataset.adsenseFilled = '1';
    } catch {
      // 광고 차단 확장 프로그램 등
    }
  }
}

export function getAdSenseClientId(): string {
  return AD_CLIENT;
}
