import { getApiBaseForDisplay } from '../config/apiConfig';
import { formatLeaderboardDetail, formatLeaderboardScore } from '../utils/finalScore';
import { getPlayerName } from './playerSession';
import {
  fetchLeaderboardFromCache,
  fetchLeaderboardWithRetry,
  submitScore,
} from './leaderboardApi';
import {
  cachePlayerRun,
  isSamePlayer,
  padLeaderboardToTen,
  type DisplayLeaderboardEntry,
} from './leaderboardStore';

export type RunResult = {
  gameScore: number;
  distanceM: number;
  elapsedMs: number;
};

export function renderLeaderboard(
  entries: DisplayLeaderboardEntry[],
  currentPlayer?: string,
): void {
  const panel = document.getElementById('leaderboard-panel');
  const list = document.getElementById('leaderboard-list');
  const status = document.getElementById('leaderboard-status');
  if (!panel || !list || !status) return;

  list.innerHTML = '';
  const hasRealEntries = entries.some((entry) => !entry.empty);
  if (!hasRealEntries) {
    status.textContent = '아직 기록이 없습니다.';
  } else {
    status.textContent = '합산: SCORE + 거리(m) + TIME보너스';
  }

  entries.forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'leaderboard-panel__item';
    if (entry.empty) {
      li.classList.add('leaderboard-panel__item--empty');
    } else if (currentPlayer && isSamePlayer(entry.username, currentPlayer)) {
      li.classList.add('leaderboard-panel__item--me');
    }

    if (entry.empty) {
      li.innerHTML = `<span class="rank">${entry.rank}위</span><span class="name">—</span><span class="score">—</span>`;
    } else {
      li.innerHTML = `<span class="rank">${entry.rank}위</span><span class="name">${escapeHtml(entry.username)}</span><span class="score-col"><span class="score">${formatLeaderboardScore(entry)}</span><span class="detail">${formatLeaderboardDetail(entry)}</span></span>`;
    }
    list.appendChild(li);
  });

  panel.hidden = false;
}

export function hideLeaderboard(): void {
  const panel = document.getElementById('leaderboard-panel');
  if (panel) panel.hidden = true;
}

export async function saveAndLoadLeaderboard(result: RunResult): Promise<void> {
  const panel = document.getElementById('leaderboard-panel');
  const status = document.getElementById('leaderboard-status');
  if (panel) panel.hidden = false;
  if (status) status.textContent = '기록 저장 중… (첫 요청은 30초 걸릴 수 있음)';

  const username = getPlayerName();
  cachePlayerRun(username, result.gameScore, result.distanceM, result.elapsedMs);

  try {
    await submitScore(username, result.gameScore, result.distanceM, result.elapsedMs);
  } catch {
    if (status) {
      status.textContent = '서버 저장 실패 — 로컬 기록으로 표시합니다…';
    }
  }

  if (status) status.textContent = '순위표 불러오는 중…';

  try {
    const entries = await fetchLeaderboardWithRetry();
    renderLeaderboard(padLeaderboardToTen(entries), username);
  } catch {
    const cached = fetchLeaderboardFromCache();
    renderLeaderboard(padLeaderboardToTen(cached), username);
    const hint = import.meta.env.DEV
      ? '터미널에서 npm run dev:api 실행 후 다시 시도'
      : '잠시 후 재시작하거나 새로고침';
    if (status) {
      status.textContent =
        cached.some((e) => e.total_score > 0)
          ? `서버 연결 실패 — 저장된 기록 표시 중 (${hint})`
          : `순위표를 불러오지 못했습니다. (${hint}) API: ${getApiBaseForDisplay()}`;
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
