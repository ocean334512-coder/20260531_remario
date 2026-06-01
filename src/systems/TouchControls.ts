import Phaser from 'phaser';
import { isTouchDevice } from '../config/gameConfig';
import { computeTouchLayout, type TouchButton } from './touchLayout';

type ButtonBinding = {
  ring: Phaser.GameObjects.Arc;
  onDown: () => void;
  onUp: () => void;
};

/** 모바일: UIScene 위 대형 버튼 + 멀티터치 (이동+점프 동시) */
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
  private bindings: ButtonBinding[] = [];

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
      this.destroyButtons();
    });
  }

  private rebuild = (): void => {
    if (!this.enabled) return;
    this.destroyButtons();
    const layout = computeTouchLayout(this.scene.scale.width, this.scene.scale.height);
    this.leftBtn = layout.leftBtn;
    this.rightBtn = layout.rightBtn;
    this.jumpBtn = layout.jumpBtn;
    this.drawButtons();
  };

  private destroyButtons(): void {
    for (const binding of this.bindings) {
      binding.ring.destroy();
    }
    this.bindings = [];
    this.leftDown = false;
    this.rightDown = false;
    this.jumpDown = false;
  }

  private drawButtons(): void {
    const depth = 2000;
    const { leftBtn, rightBtn, jumpBtn } = this;

    this.addButton(leftBtn, 0xffffff, 0.28, depth, '◀', '36px', () => {
      this.leftDown = true;
    }, () => {
      this.leftDown = false;
    });

    this.addButton(rightBtn, 0xffffff, 0.28, depth, '▶', '36px', () => {
      this.rightDown = true;
    }, () => {
      this.rightDown = false;
    });

    this.addButton(jumpBtn, 0xffcc00, 0.42, depth, 'JUMP', '16px', () => {
      this.jumpDown = true;
    }, () => {
      this.jumpDown = false;
    }, true);
  }

  private addButton(
    btn: TouchButton,
    color: number,
    alpha: number,
    depth: number,
    label: string,
    fontSize: string,
    onDown: () => void,
    onUp: () => void,
    bold = false,
  ): void {
    const ring = this.scene.add.circle(btn.cx, btn.cy, btn.r, color, alpha);
    ring.setScrollFactor(0).setDepth(depth);
    ring.setStrokeStyle(3, 0x000000, 0.35);
    ring.setInteractive(
      new Phaser.Geom.Circle(0, 0, btn.r),
      Phaser.Geom.Circle.Contains,
    );

    const release = (): void => {
      onUp();
    };

    ring.on('pointerdown', () => {
      onDown();
    });
    ring.on('pointerup', release);
    ring.on('pointerout', release);

    this.scene.add
      .text(btn.cx, btn.cy, label, {
        fontSize,
        fontFamily: 'monospace',
        fontStyle: bold ? 'bold' : 'normal',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    this.bindings.push({ ring, onDown, onUp });
  }

  preUpdate(): void {
    if (!this.enabled) return;
    this.jumpJustDown = this.jumpDown && !this.jumpWasDown;
    this.jumpJustUp = !this.jumpDown && this.jumpWasDown;
    this.jumpWasDown = this.jumpDown;
  }
}
