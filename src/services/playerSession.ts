const STORAGE_KEY = 'mario-username';

let playerName = '';

export function getPlayerName(): string {
  return playerName;
}

export function waitForPlayerName(): Promise<string> {
  return new Promise((resolve) => {
    const overlay = document.getElementById('name-entry');
    const input = document.getElementById('player-name') as HTMLInputElement | null;
    const form = document.getElementById('name-entry-form') as HTMLFormElement | null;
    const errorEl = document.getElementById('name-entry-error');

    if (!overlay || !input || !form) {
      playerName = 'Player';
      resolve(playerName);
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) input.value = saved;

    const showError = (msg: string): void => {
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.hidden = !msg;
      }
    };

    form.onsubmit = (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (name.length < 1) {
        showError('이름을 입력해 주세요.');
        input.focus();
        return;
      }
      if (name.length > 20) {
        showError('이름은 20자 이하로 입력해 주세요.');
        return;
      }

      playerName = name;
      localStorage.setItem(STORAGE_KEY, name);
      overlay.classList.add('name-entry--hidden');
      resolve(name);
    };

    input.focus();
  });
}
