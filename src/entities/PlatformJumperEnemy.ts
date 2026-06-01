import Phaser from 'phaser';
import { Enemy } from './Enemy';
import type { Player } from './Player';

/** 발판을 뛰어올라 천천히 접근하는 초반형 적 */
export class PlatformJumperEnemy extends Enemy {
  private jumpCooldown = 0;
  private readonly jumpCooldownMs = 1300;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'goomba');
    this.speed = 48;
    this.chaseSpeed = 62;
    this.chaseRange = 190;
    this.edgeProbe = 16;
    this.jumpCooldown = Phaser.Math.Between(200, 800);
  }

  update(): void {
    if (this.isDead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const player = this.findPlayer();
    const delta = this.scene.game.loop.delta;
    this.jumpCooldown -= delta;

    if (body.onFloor() && this.jumpCooldown <= 0 && this.shouldPlatformJump(player)) {
      this.performPlatformJump(player);
      this.jumpCooldown = this.jumpCooldownMs;
    }

    super.update();

    if (!body.onFloor()) {
      this.setFlipX(body.velocity.x < 0);
    }
  }

  private shouldPlatformJump(player?: Player): boolean {
    if (!player || player.isDead || player.inputLocked) return false;

    const dist = Math.abs(player.x - this.x);
    if (dist > this.chaseRange + 60) return false;

    const dir = Math.sign(player.x - this.x) || this.patrolDir;

    if (!this.canWalkDirection(dir)) return true;
    if (player.y < this.y - 40) return true;
    if (this.findFloatingPlatform(dir) !== null) return true;

    return false;
  }

  private performPlatformJump(player?: Player): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let dir = this.patrolDir;
    if (player && !player.isDead) {
      dir = Math.sign(player.x - this.x) || dir;
    }

    const platform = this.findFloatingPlatform(dir);
    let vx = dir * 120;
    let vy = -270;

    if (platform) {
      const pb = platform.body as Phaser.Physics.Arcade.StaticBody;
      const dx = platform.x - this.x;
      const rise = body.bottom - pb.top;
      vx = Phaser.Math.Clamp(dx * 1.15, -150, 150);
      vy = Phaser.Math.Clamp(-240 - rise * 1.8, -330, -210);
    } else if (player) {
      vx = Phaser.Math.Clamp((player.x - this.x) * 0.75, -130, 130);
      vy = player.y < this.y - 40 ? -300 : -250;
    }

    body.setVelocity(vx, vy);
  }

  private findFloatingPlatform(dir: number): Phaser.Physics.Arcade.Sprite | null {
    const platforms = this.scene.registry.get('platforms') as
      | Phaser.Physics.Arcade.StaticGroup
      | undefined;
    if (!platforms) return null;

    const body = this.body as Phaser.Physics.Arcade.Body;
    let best: Phaser.Physics.Arcade.Sprite | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const obj of platforms.getChildren()) {
      const tile = obj as Phaser.Physics.Arcade.Sprite;
      if (!tile.getData('oneWay')) continue;

      const pb = tile.body as Phaser.Physics.Arcade.StaticBody;
      const dx = tile.x - this.x;
      if (dx * dir <= 6) continue;
      if (Math.abs(dx) > 120) continue;

      const rise = body.bottom - pb.top;
      if (rise < 24 || rise > 100) continue;

      const score = Math.abs(dx) + rise * 1.4;
      if (score < bestScore) {
        bestScore = score;
        best = tile;
      }
    }

    return best;
  }
}
