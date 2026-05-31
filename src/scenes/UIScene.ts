import Phaser from 'phaser';
import { isTouchDevice } from '../config/gameConfig';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const score = this.registry.get('score') as number;
    const lives = this.registry.get('lives') as number;

    this.scoreText = this.add.text(16, 12, `SCORE ${score}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.scoreText.setScrollFactor(0);

    this.livesText = this.add.text(w - 16, 12, `LIVES ${lives}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.livesText.setOrigin(1, 0);
    this.livesText.setScrollFactor(0);

    const help = isTouchDevice()
      ? '왼쪽·가운데 터치=이동 | 오른쪽 아래=점프 (동시 가능) · v14'
      : '← → 이동 | Space 점프 | R 재시작 · v14';

    this.helpText = this.add.text(w / 2, 40, help, {
      fontFamily: 'monospace',
      fontSize: isTouchDevice() ? '12px' : '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.helpText.setOrigin(0.5, 0);
    this.helpText.setScrollFactor(0);

    this.overlayText = this.add.text(w / 2, h / 2, '', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    });
    this.overlayText.setOrigin(0.5);
    this.overlayText.setScrollFactor(0);
    this.overlayText.setVisible(false);

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('score-changed', (score: number) => {
      this.scoreText.setText(`SCORE ${score}`);
    });
    gameScene.events.on('lives-changed', (lives: number) => {
      this.livesText.setText(`LIVES ${lives}`);
    });
    gameScene.events.on('game-over', () => {
      this.showOverlay('GAME OVER\nR 키로 재시작');
    });
    gameScene.events.on('stage-clear', () => {
      this.showOverlay('STAGE CLEAR!\nR 키로 재시작');
    });

    this.events.on('reset-ui', () => {
      this.scoreText.setText('SCORE 0');
      this.livesText.setText('LIVES 3');
      this.overlayText.setVisible(false);
    });
  }

  private showOverlay(message: string): void {
    this.overlayText.setText(message);
    this.overlayText.setVisible(true);
  }
}
