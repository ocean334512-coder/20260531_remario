import { STAGE1_ID } from '../constants/stage';
import { apiUrl } from '../config/apiConfig';

type PlayCountResponse = {
  stage_id: string;
  play_count: number;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export async function fetchPlayCount(stageId = STAGE1_ID): Promise<number> {
  const res = await fetch(apiUrl(`/api/stats/${stageId}/play-count`));
  if (!res.ok) {
    throw new Error(`play-count fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as PlayCountResponse;
  return Math.max(0, data.play_count ?? 0);
}

export async function postPlayRecorded(stageId = STAGE1_ID): Promise<number> {
  const res = await fetch(apiUrl(`/api/stats/${stageId}/play`), {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`play record failed: ${res.status}`);
  }
  const data = (await res.json()) as PlayCountResponse;
  return Math.max(0, data.play_count ?? 0);
}

export async function postPlayPendingAdd(
  add: number,
  stageId = STAGE1_ID,
): Promise<number> {
  const res = await fetch(apiUrl(`/api/stats/${stageId}/play/add`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ add }),
  });
  if (!res.ok) {
    throw new Error(`play pending sync failed: ${res.status}`);
  }
  const data = (await res.json()) as PlayCountResponse;
  return Math.max(0, data.play_count ?? 0);
}

export async function fetchPlayCountWithRetry(
  stageId = STAGE1_ID,
  attempts = 3,
): Promise<number> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetchPlayCount(stageId);
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await sleep(1200);
    }
  }
  throw lastError;
}

export async function syncPendingPlayCountWithRetry(
  pending: number,
  stageId = STAGE1_ID,
  attempts = 4,
): Promise<number | null> {
  if (pending <= 0) return null;
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await postPlayPendingAdd(pending, stageId);
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await sleep(1500 * (i + 1));
    }
  }
  console.warn('[play-count] pending sync failed', lastError);
  return null;
}
