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
