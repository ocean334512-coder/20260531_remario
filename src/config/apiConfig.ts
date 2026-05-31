const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;

/** Render 배포 API (Vercel env 미설정 시 프로덕션 fallback) */
const DEFAULT_PROD_API = 'https://two0260531-remario.onrender.com';

/** API 베이스 (끝 슬래시 없음). dev에서 미설정 시 Vite proxy `/api` 사용 */
export const API_BASE_URL =
  raw?.replace(/\/$/, '') ?? (import.meta.env.PROD ? DEFAULT_PROD_API : '');

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_URL) return `${API_BASE_URL}${p}`;
  return p;
}

export function getApiBaseForDisplay(): string {
  return API_BASE_URL || '(dev proxy /api)';
}
