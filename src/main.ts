import Phaser from 'phaser';
import { gameConfig, syncGameDimensions } from './config/gameConfig';
import './style.css';

const game = new Phaser.Game(gameConfig);

const onLayoutChange = (): void => {
  syncGameDimensions(game);
};

window.addEventListener('resize', onLayoutChange);
window.addEventListener('orientationchange', () => {
  window.setTimeout(onLayoutChange, 150);
});

if (screen.orientation?.lock) {
  const tryLockPortrait = (): void => {
    screen.orientation.lock('portrait-primary').catch(() => undefined);
  };
  document.body.addEventListener('touchstart', tryLockPortrait, { once: true });
}
