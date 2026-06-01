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

  /**
   * 포인터 ID별로 눌림을 추적해, 다른 버튼을 동시에 눌러도
   * 한 손가락을 뗄 때 다른 버튼 상태가 꼬이지 않게 한다.
   */
  private bindButton(id: string, setDown: (down: boolean) => void): void {
    const el = document.getElementById(id);
    if (!el) return;

    const activePointers = new Set<number>();

    const sync = (): void => {
      setDown(activePointers.size > 0);
    };

    const onPointerDown = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      activePointers.add(e.pointerId);
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* 일부 브라우저에서 캡처 실패해도 pointerup으로 해제 */
      }
      sync();
    };

    const onPointerUp = (e: PointerEvent): void => {
      activePointers.delete(e.pointerId);
      try {
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* ignore */
      }
      sync();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('lostpointercapture', onPointerUp);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  preUpdate(): void {
    if (!this.enabled) return;
    this.jumpJustDown = this.jumpDown && !this.jumpWasDown;
    this.jumpJustUp = !this.jumpDown && this.jumpWasDown;
    this.jumpWasDown = this.jumpDown;
  }
}

/** 미니맵이 터치 버튼과 겹치지 않도록 하는 하단 여백(px) */
export const TOUCH_BAR_HEIGHT = 240;
