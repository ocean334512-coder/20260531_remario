import { getApiBaseForDisplay } from '../config/apiConfig';
import { formatLeaderboardScore } from '../utils/finalScore';
import { getPlayerName } from './playerSession';
import {
  fetchLeaderboardFromCache,
  getPrefetchedLeaderboard,
  submitAndFetchLeaderboard,
} from './leaderboardApi';
import {
  cachePlayerRun,
  isSamePlayer,
  padLeaderboardSlots,
  type DisplayLeaderboardEntry,
} from './leaderboardStore';

export type RunResult = {
  gameScore: number;
  distanceM: number;
  elapsedMs: number;
};

let closeBound = false;

function getModalElements(): {
  modal: HTMLElement | null;
  list: HTMLElement | null;
  status: HTMLElement | null;
  closeBtn: HTMLElement | null;
} {
  return {
    modal: document.getElementById('leaderboard-modal'),
    list: document.getElementById('leaderboard-list'),
    status: document.getElementById('leaderboard-status'),
    closeBtn: document.getElementById('leaderboard-close'),
  };
}

function bindCloseHandlers(): void {
  if (closeBound) return;
  closeBound = true;

  const { modal, closeBtn } = getModalElements();
  closeBtn?.addEventListener('click', () => {
    hideLeaderboard();
  });

  modal?.querySelector('.leaderboard-modal__backdrop')?.addEventListener('click', () => {
    hideLeaderboard();
  });
}

export function renderLeaderboard(
  entries: DisplayLeaderboardEntry[],
  currentPlayer?: string,
  options?: { fromServer?: boolean; loading?: boolean },
): void {
  bindCloseHandlers();
  const { modal, list, status } = getModalElements();
  if (!modal || !list || !status) return;

  list.innerHTML = '';
  const hasRealEntries = entries.some((entry) => !entry.empty);

  if (options?.loading) {
    status.textContent = '순위 불러오는 중…';
  } else if (!hasRealEntries) {
    status.textContent = '아직 기록이 없습니다.';
  } else if (options?.fromServer === false) {
    status.textContent = '서버 연결 전 — 이 기기에 저장된 기록만 표시';
  } else {
    status.textContent = '전체 플레이어 공통 순위 (서버)';
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

  modal.hidden = false;
  document.body.classList.add('leaderboard-open');

  const touchRoot = document.getElementById('touch-controls');
  if (touchRoot) touchRoot.hidden = true;
}

export function hideLeaderboard(): void {
  const { modal } = getModalElements();
  if (modal) modal.hidden = true;
  document.body.classList.remove('leaderboard-open');

  const touchRoot = document.getElementById('touch-controls');
  if (touchRoot && document.documentElement.classList.contains('is-mobile')) {
    touchRoot.hidden = false;
  }
}

export async function saveAndLoadLeaderboard(result: RunResult): Promise<void> {
  bindCloseHandlers();
  const username = getPlayerName();

  cachePlayerRun(username, result.gameScore, result.distanceM, result.elapsedMs);

  const prefetched = getPrefetchedLeaderboard();
  const instant = prefetched?.length
    ? padLeaderboardSlots(prefetched)
    : padLeaderboardSlots(fetchLeaderboardFromCache());

  renderLeaderboard(instant, username, {
    fromServer: !!prefetched?.length,
    loading: true,
  });

  try {
    const { entries, fromServer } = await submitAndFetchLeaderboard(
      username,
      result.gameScore,
      result.distanceM,
      result.elapsedMs,
    );

    renderLeaderboard(padLeaderboardSlots(entries), username, { fromServer });

    if (!fromServer) {
      const { status } = getModalElements();
      if (status) {
        const hint = import.meta.env.DEV
          ? 'npm run dev:api 실행 후 다시 시도'
          : '잠시 후 다시 플레이';
        status.textContent = `서버 연결 실패 — 오프라인 기록 (${hint}) · API: ${getApiBaseForDisplay()}`;
      }
    }
  } catch {
    renderLeaderboard(
      padLeaderboardSlots(fetchLeaderboardFromCache()),
      username,
      { fromServer: false },
    );
    const { status } = getModalElements();
    if (status) {
      status.textContent = `순위를 불러오지 못했습니다. API: ${getApiBaseForDisplay()}`;
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
