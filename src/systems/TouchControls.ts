import { isTouchDevice } from '../config/gameConfig';

/** 모바일: HTML 오버레이 버튼 (Phaser 입력·회전 이슈 회피) */
export class TouchControls {
  leftDown = false;
  rightDown = false;
  jumpDown = false;
  jumpJustDown = false;
  jumpJustUp = false;

  private jumpWasDown = false;
  private readonly enabled: boolean;
  private readonly root: HTMLElement | null;

  static isTouchDevice = isTouchDevice;

  constructor() {
    this.enabled = isTouchDevice();
    this.root = document.getElementById('touch-controls');
    if (!this.enabled || !this.root) return;

    this.root.hidden = false;
    this.bindButton('btn-left', (down) => {
      this.leftDown = down;
    });
    this.bindButton('btn-right', (down) => {
      this.rightDown = down;
    });
    this.bindButton('btn-jump', (down) => {
      this.jumpDown = down;
    });
  }

  setVisible(visible: boolean): void {
    if (this.root) this.root.hidden = !visible;
  }

  private bindButton(id: string, setDown: (down: boolean) => void): void {
    const el = document.getElementById(id);
    if (!el) return;

    const onDown = (e: Event): void => {
      e.preventDefault();
      setDown(true);
    };
    const onUp = (): void => {
      setDown(false);
    };

    el.addEventListener('touchstart', onDown, { passive: false });
    el.addEventListener('touchend', onUp);
    el.addEventListener('touchcancel', onUp);
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('mouseleave', onUp);
  }

  preUpdate(): void {
    if (!this.enabled) return;
    this.jumpJustDown = this.jumpDown && !this.jumpWasDown;
    this.jumpJustUp = !this.jumpDown && this.jumpWasDown;
    this.jumpWasDown = this.jumpDown;
  }
}

/** 미니맵이 터치 버튼과 겹치지 않도록 하는 하단 여백(px) */
export const TOUCH_BAR_HEIGHT = 96;
