import Phaser from 'phaser';
import { Enemy } from './Enemy';
import type { Player } from './Player';

export class ThrowerEnemy extends Enemy {
  private throwCooldown = 0;
  private readonly throwInterval = 320;
  private readonly projectileSpeed = 300;
  private isThrowing = false;
  private throwLockMs = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'koopa');
    this.animKey = 'koopa-walk';
    this.speed = 85;
    this.chaseSpeed = 105;
    this.chaseRange = 680;
    this.edgeProbe = 24;
    this.play('koopa-walk');
    this.throwCooldown = Phaser.Math.Between(60, 200);
  }

  update(): void {
    if (this.isDead) return;

    const player = this.findPlayer();
    const delta = this.scene.game.loop.delta;
    super.update();

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setFlipX(body.velocity.x < 0);
    const walkAnim = this.isThrowing ? 'koopa-throw' : 'koopa-walk';
    if (!this.anims.isPlaying || this.anims.currentAnim?.key !== walkAnim) {
      this.play(walkAnim);
    }

    if (this.isThrowing) {
      this.throwLockMs -= delta;
      if (this.throwLockMs <= 0) {
        this.isThrowing = false;
        if (!this.isDead) this.play('koopa-walk');
      }
      return;
    }

    this.throwCooldown -= delta;
    if (this.throwCooldown > 0) return;

    if (!player || player.isDead || player.inputLocked) {
      this.throwCooldown = 120;
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist > this.chaseRange) {
      this.throwCooldown = 80;
      return;
    }

    this.throwAt(player);
  }

  private throwAt(player: Player): void {
    this.isThrowing = true;
    this.throwLockMs = 220;
    this.play('koopa-throw');

    this.scene.time.delayedCall(70, () => {
      if (this.isDead) return;

      const projectiles = this.scene.registry.get('projectiles') as
        | Phaser.Physics.Arcade.Group
        | undefined;
      if (!projectiles) return;

      const flip = this.flipX ? -1 : 1;
      const ball = projectiles.create(
        this.x + flip * 12,
        this.y - 8,
        'projectile',
      ) as Phaser.Physics.Arcade.Sprite;
      ball.setCircle(5);
      ball.setDepth(6);

      const angle = Phaser.Math.Angle.Between(
        ball.x,
        ball.y,
        player.x,
        player.y - 8,
      );
      ball.setVelocity(
        Math.cos(angle) * this.projectileSpeed,
        Math.sin(angle) * this.projectileSpeed,
      );

      this.scene.time.delayedCall(3500, () => {
        if (ball.active) ball.destroy();
      });
    });

    this.throwCooldown = this.throwInterval;
  }

  stomp(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.isThrowing = false;
    this.setVelocity(0, 0);
    this.anims.stop();
    this.setTint(0x444444);
    this.scene.time.delayedCall(300, () => {
      this.destroy();
    });
  }
}
