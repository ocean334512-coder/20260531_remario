import Phaser from 'phaser';
import type { Player } from './Player';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected speed = 80;
  protected chaseSpeed = 100;
  protected chaseRange = 360;
  protected edgeProbe = 22;
  isDead = false;
  protected animKey = 'goomba-walk';
  protected patrolDir = -1;

  constructor(scene: Phaser.Scene, x: number, y: number, texture = 'goomba') {
    super(scene, x, y, texture, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setBounce(0);
    this.setSize(22, 22);
    this.setOffset(5, 10);
    this.patrolDir = -1;
    this.setVelocityX(this.patrolDir * this.speed);
    this.play(this.animKey);
  }

  update(): void {
    if (this.isDead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const player = this.findPlayer();
    let moveDir = this.patrolDir;

    if (player && !player.isDead && !player.inputLocked) {
      const dist = Math.abs(player.x - this.x);
      if (dist < this.chaseRange) {
        moveDir = Math.sign(player.x - this.x) || this.patrolDir;
      }
    }

    if (body.blocked.left) {
      moveDir = 1;
    } else if (body.blocked.right) {
      moveDir = -1;
    }

    if (body.onFloor() && !this.canWalkDirection(moveDir)) {
      moveDir = -moveDir;
    }

    this.patrolDir = moveDir;
    const moveSpeed =
      player &&
      !player.isDead &&
      !player.inputLocked &&
      Math.abs(player.x - this.x) < this.chaseRange
        ? this.chaseSpeed
        : this.speed;
    this.setVelocityX(moveDir * moveSpeed);

    this.setFlipX(body.velocity.x < 0);
    if (!this.anims.isPlaying || this.anims.currentAnim?.key !== this.animKey) {
      this.play(this.animKey);
    }
  }

  protected canWalkDirection(dir: number): boolean {
    if (dir === 0) return false;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body.onFloor()) return true;

    const aheadX = this.x + dir * this.edgeProbe;
    const footY = body.bottom;
    const platforms = this.scene.registry.get('platforms') as
      | Phaser.Physics.Arcade.StaticGroup
      | undefined;
    if (!platforms) return true;

    let hasSupport = false;
    for (const obj of platforms.getChildren()) {
      if (hasSupport) break;
      const tile = obj as Phaser.Physics.Arcade.Sprite;
      const platformBody = tile.body as Phaser.Physics.Arcade.StaticBody;
      if (aheadX < platformBody.left - 2 || aheadX > platformBody.right + 2) {
        continue;
      }
      if (Math.abs(platformBody.top - footY) <= 12) {
        hasSupport = true;
      }
    }

    return hasSupport;
  }

  protected findPlayer(): Player | undefined {
    const scene = this.scene as Phaser.Scene & { player?: Player };
    return scene.player;
  }

  stomp(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.setVelocity(0, 0);
    this.anims.stop();
    this.setTint(0x666666);
    this.setAngle(180);
    this.scene.time.delayedCall(300, () => {
      this.destroy();
    });
  }
}
