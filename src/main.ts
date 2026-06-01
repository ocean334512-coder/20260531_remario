import Phaser from 'phaser';
import { gameConfig, syncGameDimensions } from './config/gameConfig';
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
  await Promise.all([restoreLeaderboardOnBoot(), restorePlayCountOnBoot()]);

  const game = new Phaser.Game(gameConfig);
  installPlayCountPersistence(game.registry);

  const onLayoutChange = (): void => {
    scheduleLayoutSync(game);
  };

  window.addEventListener('resize', onLayoutChange);
  window.addEventListener('orientationchange', onLayoutChange);
  window.visualViewport?.addEventListener('resize', onLayoutChange);
  screen.orientation?.addEventListener('change', onLayoutChange);
}

bootstrap();
