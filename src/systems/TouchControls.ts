import Phaser from 'phaser';
import { isTouchDevice } from '../config/gameConfig';
import { computeTouchLayout, type TouchButton } from './touchLayout';

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
  private visuals: Phaser.GameObjects.GameObject[] = [];

  static isTouchDevice = isTouchDevice;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enabled = isTouchDevice();
    if (!this.enabled) return;

    scene.input.addPointer(2);
    this.rebuild();

    scene.scale.on('resize', this.rebuild, this);
    scene.events.once('shutdown', () => {
      scene.scale.off('resize', this.rebuild, this);
      this.destroyVisuals();
    });
  }

  private rebuild = (): void => {
    if (!this.enabled) return;
    this.destroyVisuals();
    const layout = computeTouchLayout(this.scene.scale.width, this.scene.scale.height);
    this.leftBtn = layout.leftBtn;
    this.rightBtn = layout.rightBtn;
    this.jumpBtn = layout.jumpBtn;
    this.drawButtons();
  };

  private destroyVisuals(): void {
    for (const obj of this.visuals) obj.destroy();
    this.visuals = [];
  }

  private drawButtons(): void {
    const depth = 2000;
    const { leftBtn, rightBtn, jumpBtn } = this;

    this.track(this.addButtonCircle(leftBtn, 0xffffff, 0.28, depth));
    this.track(this.addButtonLabel(leftBtn.cx, leftBtn.cy, '◀', '36px', depth + 1));

    this.track(this.addButtonCircle(rightBtn, 0xffffff, 0.28, depth));
    this.track(this.addButtonLabel(rightBtn.cx, rightBtn.cy, '▶', '36px', depth + 1));

    this.track(this.addButtonCircle(jumpBtn, 0xffcc00, 0.42, depth));
    this.track(this.addButtonLabel(jumpBtn.cx, jumpBtn.cy, 'JUMP', '16px', depth + 1, true));
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.visuals.push(obj);
    return obj;
  }

  private addButtonCircle(btn: TouchButton, color: number, alpha: number, depth: number): Phaser.GameObjects.Arc {
    const ring = this.scene.add.circle(btn.cx, btn.cy, btn.r, color, alpha);
    ring.setScrollFactor(0).setDepth(depth);
    ring.setStrokeStyle(3, 0x000000, 0.35);
    return ring;
  }

  private addButtonLabel(
    x: number,
    y: number,
    label: string,
    size: string,
    depth: number,
    bold = false,
  ): Phaser.GameObjects.Text {
    return this.scene.add
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
