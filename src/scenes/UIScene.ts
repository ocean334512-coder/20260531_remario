import Phaser from 'phaser';
import { applyMobileDocumentClass, isTouchDevice } from '../config/gameConfig';
import { STAGE1, TILE_SIZE, parseStage } from '../levels/stage1';
import { pixelsToMeters } from '../utils/distance';
import { Minimap } from '../systems/Minimap';
import { Fireworks } from '../systems/Fireworks';
import {
  formatDistanceHud,
  formatDeathPopupSub,
  formatGameOverMessage,
} from '../utils/distance';
import { computeFinalScore, formatElapsed } from '../utils/finalScore';
import { GameScene } from './GameScene';
import { hideLeaderboard, saveAndLoadLeaderboard } from '../services/leaderboardUi';
import {
  formatLivesHud,
  formatPlayCountHud,
  PLAY_COUNT_REGISTRY_KEY,
} from '../services/playCountStore';
import { TouchControls } from '../systems/TouchControls';

type ProgressPayload = {
  progressM: number;
  totalM: number;
  final?: boolean;
  gameScore?: number;
  elapsedMs?: number;
};

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private playCountText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private overlaySubText!: Phaser.GameObjects.Text;
  private restartHintText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private restartTapZone!: Phaser.GameObjects.Rectangle;
  private minimap!: Minimap;
  private fireworks!: Fireworks;
  private stageTotalM = 0;
  private deathPanel!: Phaser.GameObjects.Rectangle;
  private deathMeterText!: Phaser.GameObjects.Text;
  private deathSubText!: Phaser.GameObjects.Text;
  private deathHideTimer?: Phaser.Time.TimerEvent;
  private overlayBelowDeathPopup = false;
  private touchControls: TouchControls | null = null;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    if (isTouchDevice()) {
      this.touchControls = new TouchControls();
      this.registry.set('touchControls', this.touchControls);
    }

    const w = this.scale.width;
    const h = this.scale.height;
    const score = this.registry.get('score') as number;
    const lives = this.registry.get('lives') as number;
    const playCount = (this.registry.get(PLAY_COUNT_REGISTRY_KEY) as number) ?? 0;
    this.stageTotalM = this.resolveStageTotalM();

    const gameScene = this.scene.get('GameScene') as GameScene;
    if (!gameScene) {
      console.error('[UIScene] GameScene not found');
      return;
    }

    this.scoreText = this.add.text(16, 12, `SCORE ${score}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.scoreText.setScrollFactor(0);

    this.playCountText = this.add.text(w - 16, 12, formatPlayCountHud(playCount), {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#c8e6c9',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.playCountText.setOrigin(1, 0);
    this.playCountText.setScrollFactor(0);

    this.livesText = this.add.text(w - 16, 34, formatLivesHud(lives), {
      fontFamily: 'monospace',
      fontSize: '18px',
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

    this.timeText = this.add.text(w - 16, 56, 'TIME 0:00', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#b3e5fc',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.timeText.setOrigin(1, 0);
    this.timeText.setScrollFactor(0);

    const help = isTouchDevice()
      ? '◀▶ 이동 | JUMP · v33'
      : '← → 이동 | Space 점프 | R 재시작 · v33';

    this.helpText = this.add.text(w / 2, 52, help, {
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
      .setVisible(false);

    this.restartTapZone.on('pointerdown', () => {
      this.scene.get('GameScene').events.emit('request-restart');
    });

    const panelW = isTouchDevice() ? 260 : 300;
    const panelH = isTouchDevice() ? 110 : 120;
    this.deathPanel = this.add
      .rectangle(w / 2, h / 2 - 20, panelW, panelH, 0x111111, 0.92)
      .setScrollFactor(0)
      .setDepth(3200)
      .setStrokeStyle(3, 0xffeb3b, 1)
      .setVisible(false);

    this.deathMeterText = this.add
      .text(w / 2, h / 2 - 36, '', {
        fontFamily: 'monospace',
        fontSize: isTouchDevice() ? '48px' : '52px',
        color: '#ffeb3b',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3201)
      .setVisible(false);

    this.deathSubText = this.add
      .text(w / 2, h / 2 + 8, '', {
        fontFamily: 'monospace',
        fontSize: isTouchDevice() ? '16px' : '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3201)
      .setVisible(false);

    gameScene.events.on('score-changed', (nextScore: number) => {
      this.scoreText.setText(`SCORE ${nextScore}`);
    });
    gameScene.events.on('play-count-changed', (nextCount: number) => {
      this.playCountText.setText(formatPlayCountHud(nextCount));
    });
    gameScene.events.on('lives-changed', (nextLives: number) => {
      this.livesText.setText(formatLivesHud(nextLives));
    });
    gameScene.events.on('progress-changed', (progressM: number, totalM: number) => {
      this.distanceText.setText(formatDistanceHud(progressM, totalM));
    });
    gameScene.events.on('player-died', (payload: ProgressPayload) => {
      const final = payload.final === true;
      if (final) this.fireworks.stop();
      this.showDeathPopup(payload.progressM, payload.totalM, final);
      if (final) {
        const gameScore = payload.gameScore ?? 0;
        const elapsedMs = payload.elapsedMs ?? 0;
        const breakdown = computeFinalScore(gameScore, payload.progressM, elapsedMs);
        this.showOverlay(
          '',
          formatGameOverMessage(
            payload.progressM,
            payload.totalM,
            breakdown.gameScore,
            breakdown.timeBonus,
            breakdown.totalScore,
          ),
          true,
        );
        void saveAndLoadLeaderboard({
          gameScore,
          distanceM: payload.progressM,
          elapsedMs,
        });
      }
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
      this.livesText.setText(formatLivesHud(3));
      this.distanceText.setText(formatDistanceHud(0, this.stageTotalM));
      this.timeText.setText('TIME 0:00');
      this.fireworks.stop();
      this.hideDeathPopup();
      hideLeaderboard();
      this.hideOverlay();
      this.touchControls?.setVisible(true);
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
    if (gameScene?.scene?.isActive()) {
      this.timeText.setText(`TIME ${formatElapsed(gameScene.getElapsedMs())}`);
    }

    if (!gameScene?.player?.active) return;

    this.minimap.updatePlayer(
      gameScene.player.x,
      gameScene.player.y,
      gameScene.cameras.main,
    );
  }

  private resolveStageTotalM(): number {
    const gameScene = this.scene.get('GameScene') as GameScene | undefined;
    if (gameScene?.scene?.isActive() && gameScene.stageTotalM > 0) {
      return gameScene.stageTotalM;
    }
    const { spawnX, flagX } = parseStage(STAGE1);
    return pixelsToMeters(flagX - spawnX);
  }

  private onResize = (): void => {
    applyMobileDocumentClass();
    const w = this.scale.width;
    const h = this.scale.height;
    this.playCountText.setX(w - 16);
    this.livesText.setX(w - 16);
    this.timeText.setX(w - 16);
    this.distanceText.setX(w / 2);
    this.helpText.setX(w / 2);
    this.layoutDeathPopup();
    this.layoutOverlay(this.overlayBelowDeathPopup);
    this.restartTapZone.setPosition(w / 2, h / 2);
    this.restartTapZone.setSize(w, h);
  };

  private layoutDeathPopup(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const panelW = isTouchDevice() ? 260 : 300;
    const panelH = isTouchDevice() ? 110 : 120;
    this.deathPanel.setPosition(w / 2, h / 2 - 20);
    this.deathPanel.setSize(panelW, panelH);
    this.deathMeterText.setPosition(w / 2, h / 2 - 36);
    this.deathSubText.setPosition(w / 2, h / 2 + 8);
  }

  private layoutOverlay(belowDeathPopup: boolean): void {
    const w = this.scale.width;
    const h = this.scale.height;
    if (belowDeathPopup) {
      this.overlayText.setPosition(w / 2, h / 2 + 88);
      this.overlaySubText.setPosition(w / 2, h / 2 + 128);
      this.restartHintText.setPosition(w / 2, h / 2 + 168);
    } else {
      this.overlayText.setPosition(w / 2, h / 2 - 48);
      this.overlaySubText.setPosition(w / 2, h / 2 + 4);
      this.restartHintText.setPosition(w / 2, h / 2 + 72);
    }
  };

  private showDeathPopup(progressM: number, totalM: number, final: boolean): void {
    this.deathHideTimer?.remove();
    this.deathHideTimer = undefined;

    this.deathMeterText.setText(`${progressM}m`);
    this.deathSubText.setText(formatDeathPopupSub(final, totalM));
    this.deathPanel.setVisible(true);
    this.deathMeterText.setVisible(true);
    this.deathSubText.setVisible(true);
    this.deathPanel.setAlpha(1);
    this.deathMeterText.setAlpha(1);
    this.deathSubText.setAlpha(1);

    if (!final) {
      this.deathHideTimer = this.time.addEvent({
        delay: 2200,
        callback: () => this.hideDeathPopup(),
      });
    }
  }

  private hideDeathPopup(): void {
    this.deathHideTimer?.remove();
    this.deathHideTimer = undefined;
    this.deathPanel.setVisible(false);
    this.deathMeterText.setVisible(false);
    this.deathSubText.setVisible(false);
  }

  private showOverlay(title: string, subtitle?: string, belowDeathPopup = false): void {
    this.overlayBelowDeathPopup = belowDeathPopup;
    this.layoutOverlay(belowDeathPopup);
    this.overlayText.setText(title);
    this.overlayText.setVisible(title.length > 0);

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
    this.restartTapZone.setInteractive({ useHandCursor: false });
    this.touchControls?.setVisible(false);
  }

  private hideOverlay(): void {
    this.overlayBelowDeathPopup = false;
    this.hideDeathPopup();
    this.overlayText.setVisible(false);
    this.overlaySubText.setVisible(false);
    this.restartHintText.setVisible(false);
    this.restartTapZone.setVisible(false);
    this.restartTapZone.disableInteractive();
    this.touchControls?.setVisible(true);
  }
}
