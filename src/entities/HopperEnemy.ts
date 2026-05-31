import Phaser from 'phaser';
import { Enemy } from './Enemy';
import type { Player } from './Player';

export class HopperEnemy extends Enemy {
  private jumpTimer = 0;
  private readonly jumpInterval = 1200;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hopper');
    this.animKey = 'hopper-idle';
    this.speed = 75;
    this.chaseSpeed = 100;
    this.chaseRange = 400;
    this.jumpTimer = Phaser.Math.Between(200, 700);
    this.play('hopper-idle');
  }

  update(): void {
    if (this.isDead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.onFloor();
    const player = this.findPlayer();

    if (onFloor) {
      super.update();
      this.playAnim('hopper-idle');
    } else {
      this.setFlipX(body.velocity.x < 0);
      this.playAnim('hopper-jump');
    }

    const delta = this.scene.game.loop.delta;
    this.jumpTimer -= delta;

    if (this.jumpTimer <= 0 && onFloor) {
      this.hop(player);
      this.jumpTimer = this.jumpInterval;
    }
  }

  private hop(player?: Player): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let vx = body.velocity.x;

    if (player && !player.isDead && !player.inputLocked) {
      const dist = player.x - this.x;
      if (Math.abs(dist) < this.chaseRange) {
        vx = Math.sign(dist) * 160;
      }
    }

    body.setVelocity(vx, -260);
    this.play('hopper-jump');
  }

  private playAnim(key: string): void {
    if (!this.anims.isPlaying || this.anims.currentAnim?.key !== key) {
      this.play(key);
    }
  }
}
