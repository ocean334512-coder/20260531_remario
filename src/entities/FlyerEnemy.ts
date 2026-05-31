import Phaser from 'phaser';
import type { Player } from './Player';

export class FlyerEnemy extends Phaser.Physics.Arcade.Sprite {
  isDead = false;
  private readonly speed = 75;
  private dir = -1;
  private fireCooldown = 0;
  private readonly fireInterval = 1100;
  private readonly attackRange = 560;
  private readonly patrolMinX: number;
  private readonly patrolMaxX: number;
  private readonly hoverY: number;
  private bobPhase = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'airplane', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setSize(28, 16);
    this.setOffset(2, 8);
    this.patrolMinX = x - 140;
    this.patrolMaxX = x + 140;
    this.hoverY = y;
    this.fireCooldown = Phaser.Math.Between(300, 800);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityX(this.dir * this.speed);

    this.setDepth(5);
    this.play('airplane-fly');
  }

  update(): void {
    if (this.isDead) return;

    const player = this.findPlayer();
    const body = this.body as Phaser.Physics.Arcade.Body;
    const delta = this.scene.game.loop.delta;

    if (player && !player.isDead && !player.inputLocked) {
      const dist = Math.abs(player.x - this.x);
      if (dist < this.attackRange) {
        this.dir = Math.sign(player.x - this.x) || this.dir;
      }
    }

    if (this.x <= this.patrolMinX) {
      this.dir = 1;
    } else if (this.x >= this.patrolMaxX) {
      this.dir = -1;
    }

    body.setVelocityX(this.dir * this.speed);
    this.bobPhase += delta * 0.004;
    this.y = this.hoverY + Math.sin(this.bobPhase) * 10;
    this.setFlipX(this.dir < 0);

    this.fireCooldown -= delta;
    if (this.fireCooldown > 0 || !player || player.isDead || player.inputLocked) {
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist > this.attackRange) {
      this.fireCooldown = 300;
      return;
    }

    this.fireMissile(player);
  }

  private fireMissile(player: Player): void {
    const projectiles = this.scene.registry.get('projectiles') as
      | Phaser.Physics.Arcade.Group
      | undefined;
    if (!projectiles) return;

    const muzzleX = this.x + (this.flipX ? -18 : 18);
    const missile = projectiles.create(
      muzzleX,
      this.y + 6,
      'missile',
    ) as Phaser.Physics.Arcade.Sprite;
    missile.setCircle(4);
    missile.setDepth(6);
    missile.setData('fromFlyer', true);

    const angle = Phaser.Math.Angle.Between(
      missile.x,
      missile.y,
      player.x,
      player.y,
    );
    const speed = 340;
    missile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    missile.setRotation(angle);

    this.scene.time.delayedCall(4000, () => {
      if (missile.active) missile.destroy();
    });

    this.fireCooldown = this.fireInterval;
  }

  private findPlayer(): Player | undefined {
    const scene = this.scene as Phaser.Scene & { player?: Player };
    return scene.player;
  }

  stomp(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.setVelocity(0, 0);
    this.anims.stop();
    this.setTint(0x888888);
    this.scene.time.delayedCall(250, () => {
      this.destroy();
    });
  }
}
