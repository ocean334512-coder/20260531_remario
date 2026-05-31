import Phaser from 'phaser';
import { isTouchDevice } from '../config/gameConfig';

type TouchButton = { cx: number; cy: number; r: number };

/** 모바일: 하단 대형 버튼 + 멀티터치 (이동+점프 동시) */
export class TouchControls {
  leftDown = false;
  rightDown = false;
  jumpDown = false;
  jumpJustDown = false;
  jumpJustUp = false;

  private jumpWasDown = false;
  private readonly enabled: boolean;
  private readonly scene: Phaser.Scene;
  private leftBtn!: TouchButton;
  private rightBtn!: TouchButton;
  private jumpBtn!: TouchButton;

  static isTouchDevice = isTouchDevice;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enabled = isTouchDevice();
    if (!this.enabled) return;

    scene.input.addPointer(2);
    this.layoutButtons();
    this.drawButtons();
  }

  private layoutButtons(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const portrait = h > w;
    const r = portrait ? Math.min(w * 0.14, 72) : Math.min(h * 0.16, 64);
    const jumpR = r * 1.12;
    const cy = h - r - (portrait ? 28 : 20);

    this.leftBtn = { cx: w * 0.17, cy, r };
    this.rightBtn = { cx: w * 0.39, cy, r };
    this.jumpBtn = { cx: w - jumpR - (portrait ? 24 : 32), cy, r: jumpR };
  }

  private drawButtons(): void {
    const depth = 2000;
    const { leftBtn, rightBtn, jumpBtn } = this;

    this.addButtonCircle(leftBtn, 0xffffff, 0.28, depth);
    this.addButtonLabel(leftBtn.cx, leftBtn.cy, '◀', '40px', depth + 1);

    this.addButtonCircle(rightBtn, 0xffffff, 0.28, depth);
    this.addButtonLabel(rightBtn.cx, rightBtn.cy, '▶', '40px', depth + 1);

    this.addButtonCircle(jumpBtn, 0xffcc00, 0.42, depth);
    this.addButtonLabel(jumpBtn.cx, jumpBtn.cy, 'JUMP', '18px', depth + 1, true);
  }

  private addButtonCircle(btn: TouchButton, color: number, alpha: number, depth: number): void {
    const ring = this.scene.add.circle(btn.cx, btn.cy, btn.r, color, alpha);
    ring.setScrollFactor(0).setDepth(depth);
    ring.setStrokeStyle(3, 0x000000, 0.35);
  }

  private addButtonLabel(
    x: number,
    y: number,
    label: string,
    size: string,
    depth: number,
    bold = false,
  ): void {
    this.scene.add
      .text(x, y, label, {
        fontSize: size,
        fontFamily: 'monospace',
        fontStyle: bold ? 'bold' : 'normal',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth);
  }

  private inCircle(x: number, y: number, btn: TouchButton): boolean {
    const dx = x - btn.cx;
    const dy = y - btn.cy;
    return dx * dx + dy * dy <= btn.r * btn.r;
  }

  private readPointers(): void {
    this.leftDown = false;
    this.rightDown = false;
    this.jumpDown = false;

    for (const pointer of this.scene.input.manager.pointers) {
      if (!pointer.isDown) continue;

      const x = pointer.x;
      const y = pointer.y;

      if (this.inCircle(x, y, this.jumpBtn)) {
        this.jumpDown = true;
      }
      if (this.inCircle(x, y, this.leftBtn)) {
        this.leftDown = true;
      }
      if (this.inCircle(x, y, this.rightBtn)) {
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
