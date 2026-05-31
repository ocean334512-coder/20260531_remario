import Phaser from 'phaser';
import { isTouchDevice } from '../config/gameConfig';
import { STAGE1, TILE_SIZE, parseStage } from '../levels/stage1';
import { Minimap } from '../systems/Minimap';
import { Fireworks } from '../systems/Fireworks';
import {
  formatDistanceHud,
  formatGameOverMessage,
} from '../utils/distance';
import { GameScene } from './GameScene';

type ProgressPayload = { progressM: number; totalM: number };

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private overlaySubText!: Phaser.GameObjects.Text;
  private restartHintText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private restartTapZone!: Phaser.GameObjects.Rectangle;
  private minimap!: Minimap;
  private fireworks!: Fireworks;
  private stageTotalM = 0;

  constructor() {
    super('UIScene');
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const score = this.registry.get('score') as number;
    const lives = this.registry.get('lives') as number;
    const gameScene = this.scene.get('GameScene') as GameScene;
    this.stageTotalM = gameScene.stageTotalM;

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

    this.distanceText = this.add.text(w / 2, 12, formatDistanceHud(0, this.stageTotalM), {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffeb3b',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.distanceText.setOrigin(0.5, 0);
    this.distanceText.setScrollFactor(0);

    const help = isTouchDevice()
      ? '하단 ◀▶ 이동 | 우측 JUMP · v19'
      : '← → 이동 | Space 점프 | R 재시작 · v19';

    this.helpText = this.add.text(w / 2, 38, help, {
      fontFamily: 'monospace',
      fontSize: isTouchDevice() ? '12px' : '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.helpText.setOrigin(0.5, 0);
    this.helpText.setScrollFactor(0);

    this.overlayText = this.add.text(w / 2, h / 2 - 48, '', {
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
    this.overlayText.setDepth(3100);

    this.overlaySubText = this.add.text(w / 2, h / 2 + 4, '', {
      fontFamily: 'monospace',
      fontSize: isTouchDevice() ? '20px' : '22px',
      color: '#ffeb3b',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    this.overlaySubText.setOrigin(0.5);
    this.overlaySubText.setScrollFactor(0);
    this.overlaySubText.setVisible(false);
    this.overlaySubText.setDepth(3100);

    this.restartHintText = this.add.text(w / 2, h / 2 + 72, '', {
      fontFamily: 'monospace',
      fontSize: isTouchDevice() ? '22px' : '18px',
      color: '#ffeb3b',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    this.restartHintText.setOrigin(0.5);
    this.restartHintText.setScrollFactor(0);
    this.restartHintText.setVisible(false);
    this.restartHintText.setDepth(3100);

    this.restartTapZone = this.add
      .rectangle(w / 2, h / 2, w, h, 0x000000, 0.45)
      .setScrollFactor(0)
      .setDepth(3000)
      .setInteractive({ useHandCursor: false })
      .setVisible(false);

    this.restartTapZone.on('pointerdown', () => {
      this.scene.get('GameScene').events.emit('request-restart');
    });

    gameScene.events.on('score-changed', (nextScore: number) => {
      this.scoreText.setText(`SCORE ${nextScore}`);
    });
    gameScene.events.on('lives-changed', (nextLives: number) => {
      this.livesText.setText(`LIVES ${nextLives}`);
    });
    gameScene.events.on('progress-changed', (progressM: number, totalM: number) => {
      this.distanceText.setText(formatDistanceHud(progressM, totalM));
    });
    gameScene.events.on('game-over', (payload: ProgressPayload) => {
      this.fireworks.stop();
      this.showOverlay('GAME OVER', formatGameOverMessage(payload.progressM, payload.totalM));
    });
    gameScene.events.on('stage-clear', (payload: ProgressPayload) => {
      this.distanceText.setText(formatDistanceHud(payload.progressM, payload.totalM));
      this.showOverlay(
        'STAGE CLEAR!',
        `${payload.totalM}m 완주!\n축하합니다!`,
      );
      this.fireworks.start();
    });

    this.events.on('reset-ui', () => {
      this.scoreText.setText('SCORE 0');
      this.livesText.setText('LIVES 3');
      this.distanceText.setText(formatDistanceHud(0, this.stageTotalM));
      this.fireworks.stop();
      this.hideOverlay();
    });

    const { width, height } = parseStage(STAGE1);
    this.minimap = new Minimap(
      this,
      STAGE1,
      TILE_SIZE,
      width * TILE_SIZE,
      height * TILE_SIZE,
    );
    this.fireworks = new Fireworks(this);

    this.scale.on('resize', this.onResize, this);
  }

  update(_time: number, delta: number): void {
    this.fireworks.update(_time, delta);

    const gameScene = this.scene.get('GameScene') as GameScene;
    if (!gameScene?.player?.active) return;

    this.minimap.updatePlayer(
      gameScene.player.x,
      gameScene.player.y,
      gameScene.cameras.main,
    );
  }

  private onResize = (): void => {
    const w = this.scale.width;
    const h = this.scale.height;
    this.livesText.setX(w - 16);
    this.distanceText.setX(w / 2);
    this.helpText.setX(w / 2);
    this.overlayText.setPosition(w / 2, h / 2 - 48);
    this.overlaySubText.setPosition(w / 2, h / 2 + 4);
    this.restartHintText.setPosition(w / 2, h / 2 + 72);
    this.restartTapZone.setPosition(w / 2, h / 2);
    this.restartTapZone.setSize(w, h);
  };

  private showOverlay(title: string, subtitle?: string): void {
    this.overlayText.setText(title);
    this.overlayText.setVisible(true);

    if (subtitle) {
      this.overlaySubText.setText(subtitle);
      this.overlaySubText.setVisible(true);
    } else {
      this.overlaySubText.setVisible(false);
    }

    const hint = isTouchDevice() ? '화면을 탭하여 재시작' : 'R 키로 재시작';
    this.restartHintText.setText(hint);
    this.restartHintText.setVisible(true);
    this.restartTapZone.setVisible(true);
  }

  private hideOverlay(): void {
    this.overlayText.setVisible(false);
    this.overlaySubText.setVisible(false);
    this.restartHintText.setVisible(false);
    this.restartTapZone.setVisible(false);
  }
}
