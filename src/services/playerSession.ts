import { HERO_TEXTURE_BOY, HERO_TEXTURE_GIRL } from '../assets/heroAssets';

const STORAGE_KEY_NAME = 'mario-username';
const STORAGE_KEY_CHARACTER = 'mario-character';

export type PlayerCharacter = 'boy' | 'girl';

let playerName = '';
let playerCharacter: PlayerCharacter = 'boy';

export function getPlayerName(): string {
  return playerName;
}

export function getPlayerCharacter(): PlayerCharacter {
  return playerCharacter;
}

export function getHeroTextureKey(): string {
  return playerCharacter === 'girl' ? HERO_TEXTURE_GIRL : HERO_TEXTURE_BOY;
}

function parseCharacter(value: string | null): PlayerCharacter {
  return value === 'girl' ? 'girl' : 'boy';
}

function syncCharacterUi(charInputs: NodeListOf<HTMLInputElement>): void {
  charInputs.forEach((input) => {
    const label = input.closest('.name-entry__char');
    if (label) {
      label.classList.toggle('name-entry__char--selected', input.checked);
    }
  });
}

export function waitForPlayerName(): Promise<string> {
  return new Promise((resolve) => {
    const overlay = document.getElementById('name-entry');
    const input = document.getElementById('player-name') as HTMLInputElement | null;
    const form = document.getElementById('name-entry-form') as HTMLFormElement | null;
    const errorEl = document.getElementById('name-entry-error');
    const charInputs = document.querySelectorAll<HTMLInputElement>(
      'input[name="player-character"]',
    );

    if (!overlay || !input || !form) {
      playerName = 'Player';
      playerCharacter = 'boy';
      resolve(playerName);
      return;
    }

    overlay.classList.remove('name-entry--hidden');

    const savedName = localStorage.getItem(STORAGE_KEY_NAME);
    if (savedName) input.value = savedName;

    const savedChar = parseCharacter(localStorage.getItem(STORAGE_KEY_CHARACTER));
    playerCharacter = savedChar;
    charInputs.forEach((el) => {
      el.checked = el.value === savedChar;
    });
    syncCharacterUi(charInputs);

    const showError = (msg: string): void => {
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.hidden = !msg;
      }
    };

    charInputs.forEach((el) => {
      el.addEventListener('change', () => {
        if (el.checked) {
          playerCharacter = parseCharacter(el.value);
          syncCharacterUi(charInputs);
        }
      });
    });

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

      const selected = document.querySelector<HTMLInputElement>(
        'input[name="player-character"]:checked',
      );
      playerCharacter = parseCharacter(selected?.value ?? 'boy');

      playerName = name;
      localStorage.setItem(STORAGE_KEY_NAME, name);
      localStorage.setItem(STORAGE_KEY_CHARACTER, playerCharacter);
      overlay.classList.add('name-entry--hidden');
      resolve(name);
    };

    input.focus();
  });
}
