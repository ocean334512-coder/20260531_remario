import { getPlayerName } from './playerSession';
import { fetchLeaderboard, submitScore, type LeaderboardEntry } from './leaderboardApi';

export function renderLeaderboard(
  entries: LeaderboardEntry[],
  currentPlayer?: string,
): void {
  const panel = document.getElementById('leaderboard-panel');
  const list = document.getElementById('leaderboard-list');
  const status = document.getElementById('leaderboard-status');
  if (!panel || !list || !status) return;

  list.innerHTML = '';
  if (entries.length === 0) {
    status.textContent = '아직 기록이 없습니다.';
  } else {
    status.textContent = '';
    entries.forEach((entry) => {
      const li = document.createElement('li');
      li.className = 'leaderboard-panel__item';
      if (currentPlayer && entry.username === currentPlayer) {
        li.classList.add('leaderboard-panel__item--me');
      }
      li.innerHTML = `<span class="rank">${entry.rank}위</span><span class="name">${escapeHtml(entry.username)}</span><span class="score">${entry.distance_m}m</span>`;
      list.appendChild(li);
    });
  }
  panel.hidden = false;
}

export function hideLeaderboard(): void {
  const panel = document.getElementById('leaderboard-panel');
  if (panel) panel.hidden = true;
}

export async function saveAndLoadLeaderboard(distanceM: number): Promise<void> {
  const panel = document.getElementById('leaderboard-panel');
  const status = document.getElementById('leaderboard-status');
  if (panel) panel.hidden = false;
  if (status) status.textContent = '기록 저장 중…';

  const username = getPlayerName();
  try {
    await submitScore(username, distanceM);
  } catch {
    if (status) status.textContent = '기록 저장 실패 (오프라인일 수 있음)';
  }

  try {
    const entries = await fetchLeaderboard(10);
    renderLeaderboard(entries, username);
  } catch {
    if (status) status.textContent = '순위표를 불러오지 못했습니다.';
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
