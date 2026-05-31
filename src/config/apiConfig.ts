const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;

/** API 베이스 (끝 슬래시 없음). 미설정 시 Vite dev proxy `/api` 사용 */
export const API_BASE_URL = raw?.replace(/\/$/, '') ?? '';

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_URL) return `${API_BASE_URL}${p}`;
  return p;
}
