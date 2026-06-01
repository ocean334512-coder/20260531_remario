import Phaser from 'phaser';
import {
  applyMobileDocumentClass,
  buildGameConfig,
  isTouchDevice,
  syncGameDimensions,
} from './config/gameConfig';
import {
  bindExitButton,
  hideExitButton,
  showExitButton,
  waitForGameExit,
} from './services/gameExit';
import {
  installLeaderboardPersistence,
  restoreLeaderboardOnBoot,
} from './services/leaderboardPersistence';
import { installNavigationGuard } from './services/navigationGuard';
import { installPlayCountPersistence } from './services/playCountPersistence';
import { restorePlayCountOnBoot } from './services/playCountService';
import { teardownGameAudio } from './systems/AudioManager';
import { waitForPlayerName } from './services/playerSession';
import './style.css';

function scheduleLayoutSync(game: Phaser.Game): void {
  const delays = [0, 50, 120, 250, 500, 900, 1400];
  for (const ms of delays) {
    window.setTimeout(() => {
      syncGameDimensions(game);
    }, ms);
  }
}

function bindLayoutHandlers(game: Phaser.Game): () => void {
  const onLayoutChange = (): void => {
    scheduleLayoutSync(game);
  };

  window.addEventListener('resize', onLayoutChange);
  window.addEventListener('orientationchange', onLayoutChange);
  window.visualViewport?.addEventListener('resize', onLayoutChange);
  window.visualViewport?.addEventListener('scroll', onLayoutChange);
  screen.orientation?.addEventListener('change', onLayoutChange);

  return () => {
    window.removeEventListener('resize', onLayoutChange);
    window.removeEventListener('orientationchange', onLayoutChange);
    window.visualViewport?.removeEventListener('resize', onLayoutChange);
    window.visualViewport?.removeEventListener('scroll', onLayoutChange);
    screen.orientation?.removeEventListener('change', onLayoutChange);
  };
}

async function runOneGameSession(): Promise<void> {
  applyMobileDocumentClass();

  await waitForPlayerName();

  applyMobileDocumentClass();
  if (isTouchDevice()) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 120);
    });
  }

  const game = new Phaser.Game(buildGameConfig());
  installPlayCountPersistence(game.registry);
  bindExitButton();
  showExitButton();

  const releaseNavigationGuard = installNavigationGuard();
  const unbindLayout = bindLayoutHandlers(game);

  void Promise.all([restoreLeaderboardOnBoot(), restorePlayCountOnBoot()]);

  await new Promise<void>((resolve) => {
    if (game.isBooted) {
      resolve();
      return;
    }
    game.events.once(Phaser.Core.Events.READY, () => resolve());
  });

  syncGameDimensions(game);
  scheduleLayoutSync(game);

  await waitForGameExit();

  unbindLayout();
  releaseNavigationGuard();
  hideExitButton();
  teardownGameAudio(game.registry);
  game.destroy(true);
}

async function bootstrap(): Promise<void> {
  installLeaderboardPersistence();
  applyMobileDocumentClass();
  bindExitButton();

  for (;;) {
    try {
      await runOneGameSession();
    } catch (err) {
      console.error('[game] session error', err);
      hideExitButton();
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 500);
      });
    }
  }
}

bootstrap();
