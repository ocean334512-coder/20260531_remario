import Phaser from 'phaser';
import { getAudio } from '../systems/AudioManager';
import type { TouchControls } from '../systems/TouchControls';

const MOVE_SPEED = 260;
const JUMP_INITIAL = -310;
const JUMP_HOLD_ACCEL = -7;
const MAX_BOOST_MS = 110;
const MAX_JUMP_SPEED = -350;
const SHORT_HOP_MS = 130;
const SHORT_HOP_FACTOR = 0.45;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private jumpKey: Phaser.Input.Keyboard.Key | null = null;
  private zKey: Phaser.Input.Keyboard.Key | null = null;
  private boostMs = 0;
  private jumpPressedAt = 0;
  isDead = false;
  isInvincible = false;
  inputLocked = false;

  private currentAnim = '';
  private touch: TouchControls | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setBounce(0);
    this.setSize(12, 26);
    this.setOffset(10, 5);
    this.play('hero-idle');

    const keyboard = scene.input.keyboard;
    if (!keyboard) return;

    keyboard.enabled = true;
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.Z,
      Phaser.Input.Keyboard.KeyCodes.UP,
    ]);

    this.cursors = keyboard.createCursorKeys();
    this.jumpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.zKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  }

  bindTouchControls(touch: TouchControls): void {
    this.touch = touch;
  }

  handleJumpBeforePhysics(delta: number): void {
    if (this.isDead || this.inputLocked) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.onFloor();
    const jumpDown =
      (this.jumpKey?.isDown ?? false) ||
      (this.zKey?.isDown ?? false) ||
      (this.cursors?.up.isDown ?? false) ||
      (this.touch?.jumpDown ?? false);
    const jumpJustDown =
      (this.jumpKey ? Phaser.Input.Keyboard.JustDown(this.jumpKey) : false) ||
      (this.zKey ? Phaser.Input.Keyboard.JustDown(this.zKey) : false) ||
      (this.cursors ? Phaser.Input.Keyboard.JustDown(this.cursors.up) : false) ||
      (this.touch?.jumpJustDown ?? false);
    const jumpJustUp =
      (this.jumpKey ? Phaser.Input.Keyboard.JustUp(this.jumpKey) : false) ||
      (this.zKey ? Phaser.Input.Keyboard.JustUp(this.zKey) : false) ||
      (this.cursors ? Phaser.Input.Keyboard.JustUp(this.cursors.up) : false) ||
      (this.touch?.jumpJustUp ?? false);

    if (jumpJustDown && onFloor) {
      body.setVelocityY(JUMP_INITIAL);
      this.boostMs = MAX_BOOST_MS;
      this.jumpPressedAt = this.scene.time.now;
      getAudio(this.scene)?.playJump();
    }

    if (jumpDown && this.boostMs > 0 && body.velocity.y < 0) {
      this.boostMs -= delta;
      body.setVelocityY(
        Math.max(body.velocity.y + JUMP_HOLD_ACCEL, MAX_JUMP_SPEED),
      );
    }

    if (jumpJustUp && body.velocity.y < 0) {
      const heldMs = this.scene.time.now - this.jumpPressedAt;
      if (heldMs < SHORT_HOP_MS) {
        body.setVelocityY(body.velocity.y * SHORT_HOP_FACTOR);
      }
      this.boostMs = 0;
    }
  }

  updateMovement(): void {
    if (this.isDead || this.inputLocked) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.cursors?.left.isDown || (this.touch?.leftDown ?? false)) {
      body.setVelocityX(-MOVE_SPEED);
      this.setFlipX(true);
    } else if (this.cursors?.right.isDown || (this.touch?.rightDown ?? false)) {
      body.setVelocityX(MOVE_SPEED);
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    this.updateAnimation();
  }

  private updateAnimation(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.onFloor();

    if (!onFloor) {
      if (body.velocity.y < -30) {
        this.playAnim('hero-jump');
      } else {
        this.playAnim('hero-fall');
      }
      return;
    }

    const speed = Math.abs(body.velocity.x);
    if (speed > 20) {
      this.playAnim('hero-run', Phaser.Math.Clamp(speed / MOVE_SPEED, 0.75, 1.35));
    } else {
      this.playAnim('hero-idle');
    }
  }

  private playAnim(key: string, timeScale = 1): void {
    if (this.currentAnim !== key) {
      this.currentAnim = key;
      this.play(key);
    }
    const anim = this.anims.currentAnim;
    if (anim?.key === key) {
      this.anims.timeScale = timeScale;
    }
  }

  startFlagSlide(): void {
    this.inputLocked = true;
    this.setVelocity(0, 0);
    this.currentAnim = '';
  }

  respawn(x: number, y: number): void {
    this.isDead = false;
    this.isInvincible = true;
    this.inputLocked = false;
    this.boostMs = 0;
    this.jumpPressedAt = 0;
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.setAlpha(1);
    this.currentAnim = '';
    this.play('hero-idle');
    this.scene.time.delayedCall(1500, () => {
      this.isInvincible = false;
    });
  }

  blinkInvincible(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
    });
  }
}
