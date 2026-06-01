import Phaser from 'phaser';
import { buildGameConfig, syncGameDimensions } from './config/gameConfig';
import {
  installLeaderboardPersistence,
  restoreLeaderboardOnBoot,
} from './services/leaderboardPersistence';
import { installPlayCountPersistence } from './services/playCountPersistence';
import { restorePlayCountOnBoot } from './services/playCountService';
import { waitForPlayerName } from './services/playerSession';
import './style.css';

function scheduleLayoutSync(game: Phaser.Game): void {
  const delays = [0, 80, 200, 400, 700];
  for (const ms of delays) {
    window.setTimeout(() => {
      syncGameDimensions(game);
    }, ms);
  }
}

async function bootstrap(): Promise<void> {
  installLeaderboardPersistence();

  await waitForPlayerName();

  const game = new Phaser.Game(buildGameConfig());
  installPlayCountPersistence(game.registry);
  scheduleLayoutSync(game);

  void Promise.all([restoreLeaderboardOnBoot(), restorePlayCountOnBoot()]);

  await new Promise<void>((resolve) => {
    if (game.isBooted) {
      resolve();
      return;
    }
    game.events.once(Phaser.Core.Events.READY, () => resolve());
  });
  syncGameDimensions(game);

  const onLayoutChange = (): void => {
    scheduleLayoutSync(game);
  };

  window.addEventListener('resize', onLayoutChange);
  window.addEventListener('orientationchange', onLayoutChange);
  window.visualViewport?.addEventListener('resize', onLayoutChange);
  screen.orientation?.addEventListener('change', onLayoutChange);
}

bootstrap();
