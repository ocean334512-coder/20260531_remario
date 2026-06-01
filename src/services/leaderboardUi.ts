import { getApiBaseForDisplay } from '../config/apiConfig';
import { formatLeaderboardScore } from '../utils/finalScore';
import { getPlayerName } from './playerSession';
import { fetchLeaderboardFromCache, submitAndFetchLeaderboard } from './leaderboardApi';
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
    status.textContent = '합산 점수 순위';
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
      li.innerHTML = `<span class="rank">${entry.rank}위</span><span class="name">${escapeHtml(entry.username)}</span><span class="score">${formatLeaderboardScore(entry)}</span>`;
    }
    list.appendChild(li);
  });

  panel.hidden = false;

  const touchRoot = document.getElementById('touch-controls');
  if (touchRoot) touchRoot.hidden = true;
}

export function hideLeaderboard(): void {
  const panel = document.getElementById('leaderboard-panel');
  if (panel) panel.hidden = true;
  const touchRoot = document.getElementById('touch-controls');
  if (touchRoot && document.documentElement.classList.contains('is-mobile')) {
    touchRoot.hidden = false;
  }
}

export async function saveAndLoadLeaderboard(result: RunResult): Promise<void> {
  const panel = document.getElementById('leaderboard-panel');
  const status = document.getElementById('leaderboard-status');
  if (panel) panel.hidden = false;
  if (status) status.textContent = '기록 저장 중… (첫 요청은 30초 걸릴 수 있음)';

  const username = getPlayerName();
  cachePlayerRun(username, result.gameScore, result.distanceM, result.elapsedMs);

  if (status) status.textContent = '순위표 저장·동기화 중…';

  const entries = await submitAndFetchLeaderboard(
    username,
    result.gameScore,
    result.distanceM,
    result.elapsedMs,
  );

  const fromServer = entries.some((e) => e.total_score > 0);
  renderLeaderboard(padLeaderboardToTen(entries), username);

  if (status) {
    if (fromServer) {
      status.textContent = '순위가 서버에 저장되었습니다 (업데이트 후에도 유지)';
    } else {
      const hint = import.meta.env.DEV
        ? '터미널에서 npm run dev:api 실행 후 다시 시도'
        : '잠시 후 새로고침';
      status.textContent = `서버 연결 실패 — 이 기기에 저장된 기록 표시 (${hint})`;
    }
  }

  if (!fromServer && entries.length === 0) {
    const cached = fetchLeaderboardFromCache();
    renderLeaderboard(padLeaderboardToTen(cached), username);
    if (status) {
      status.textContent = `순위표를 불러오지 못했습니다. API: ${getApiBaseForDisplay()}`;
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
