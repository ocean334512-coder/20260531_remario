import { flushPendingPlayCount } from './playCountService';

let installed = false;
let registryRef: Phaser.Data.DataManager | null = null;

export function installPlayCountPersistence(
  registry: Phaser.Data.DataManager,
): void {
  registryRef = registry;
  if (installed) return;
  installed = true;

  const flush = (): void => {
    if (registryRef) {
      void flushPendingPlayCount(registryRef);
    }
  };

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });
  window.addEventListener('pagehide', flush);
}

