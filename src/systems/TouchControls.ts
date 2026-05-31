import Phaser from 'phaser';
import { isTouchDevice } from '../config/gameConfig';

/** 모바일: 화면 구역 터치 + 멀티터치 (이동+점프 동시) */
export class TouchControls {
  leftDown = false;
  rightDown = false;
  jumpDown = false;
  jumpJustDown = false;
  jumpJustUp = false;

  private jumpWasDown = false;
  private readonly enabled: boolean;
  private readonly scene: Phaser.Scene;

  static isTouchDevice = isTouchDevice;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enabled = isTouchDevice();
    if (!this.enabled) return;

    // 두 손가락 이상 (이동 + 점프 동시)
    scene.input.addPointer(2);
    this.drawZoneHints();
  }

  private drawZoneHints(): void {
    const depth = 1998;
    const alpha = 0.12;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    const leftHint = this.scene.add.rectangle(w * 0.22, h * 0.58, w * 0.4, h * 0.72, 0xffffff, alpha);
    leftHint.setScrollFactor(0).setDepth(depth);

    const rightHint = this.scene.add.rectangle(w * 0.5, h * 0.58, w * 0.28, h * 0.72, 0xffffff, alpha);
    rightHint.setScrollFactor(0).setDepth(depth);

    const jumpHint = this.scene.add.rectangle(w * 0.82, h * 0.82, w * 0.3, h * 0.28, 0xffcc00, alpha + 0.08);
    jumpHint.setScrollFactor(0).setDepth(depth);

    this.scene.add
      .text(w * 0.22, h * 0.58, '◀', { fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5)
      .setAlpha(0.35)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    this.scene.add
      .text(w * 0.5, h * 0.58, '▶', { fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5)
      .setAlpha(0.35)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    this.scene.add
      .text(w * 0.82, h * 0.82, 'JUMP', {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);
  }

  private readPointers(): void {
    this.leftDown = false;
    this.rightDown = false;
    this.jumpDown = false;

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const hudBottom = h * 0.1;

    for (const pointer of this.scene.input.manager.pointers) {
      if (!pointer.isDown) continue;

      const x = pointer.x;
      const y = pointer.y;
      if (y < hudBottom) continue;

      const inJumpZone = y >= h * 0.68 && x >= w * 0.52;

      if (inJumpZone) {
        this.jumpDown = true;
        continue;
      }

      if (x < w * 0.48) {
        this.leftDown = true;
      } else if (x > w * 0.52) {
        this.rightDown = true;
      }
    }
  }

  preUpdate(): void {
    if (!this.enabled) return;
    this.readPointers();
    this.jumpJustDown = this.jumpDown && !this.jumpWasDown;
    this.jumpJustUp = !this.jumpDown && this.jumpWasDown;
    this.jumpWasDown = this.jumpDown;
  }
}
