import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';

export class TouchControls {
  leftDown = false;
  rightDown = false;
  jumpDown = false;
  jumpJustDown = false;
  jumpJustUp = false;

  private jumpWasDown = false;
  private readonly enabled: boolean;

  static isTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 900
    );
  }

  constructor(scene: Phaser.Scene) {
    this.enabled = TouchControls.isTouchDevice();
    if (!this.enabled) return;

    const depth = 2000;
    const alpha = 0.35;

    const leftBtn = scene.add.circle(72, GAME_HEIGHT - 72, 44, 0xffffff, alpha);
    leftBtn.setScrollFactor(0).setDepth(depth).setInteractive();
    leftBtn.on('pointerdown', () => {
      this.leftDown = true;
    });
    leftBtn.on('pointerup', () => {
      this.leftDown = false;
    });
    leftBtn.on('pointerout', () => {
      this.leftDown = false;
    });
    scene.add
      .text(72, GAME_HEIGHT - 72, '◀', {
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    const rightBtn = scene.add.circle(168, GAME_HEIGHT - 72, 44, 0xffffff, alpha);
    rightBtn.setScrollFactor(0).setDepth(depth).setInteractive();
    rightBtn.on('pointerdown', () => {
      this.rightDown = true;
    });
    rightBtn.on('pointerup', () => {
      this.rightDown = false;
    });
    rightBtn.on('pointerout', () => {
      this.rightDown = false;
    });
    scene.add
      .text(168, GAME_HEIGHT - 72, '▶', {
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    const jumpBtn = scene.add.circle(GAME_WIDTH - 72, GAME_HEIGHT - 72, 52, 0xffcc00, 0.45);
    jumpBtn.setScrollFactor(0).setDepth(depth).setInteractive();
    jumpBtn.on('pointerdown', () => {
      this.jumpDown = true;
    });
    jumpBtn.on('pointerup', () => {
      this.jumpDown = false;
    });
    jumpBtn.on('pointerout', () => {
      this.jumpDown = false;
    });
    scene.add
      .text(GAME_WIDTH - 72, GAME_HEIGHT - 72, 'JUMP', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);
  }

  preUpdate(): void {
    if (!this.enabled) return;
    this.jumpJustDown = this.jumpDown && !this.jumpWasDown;
    this.jumpJustUp = !this.jumpDown && this.jumpWasDown;
    this.jumpWasDown = this.jumpDown;
  }
}
