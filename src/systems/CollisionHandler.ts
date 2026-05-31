import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

export function handlePlayerEnemyCollision(
  playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  onStomp: () => void,
  onDamage: () => void,
): void {
  const player = playerObj as Player;
  const enemy = enemyObj as Enemy;

  if (player.isDead || player.isInvincible || enemy.isDead) return;

  const playerBody = player.body as Phaser.Physics.Arcade.Body;
  const falling = playerBody.velocity.y > 0;
  const aboveEnemy = player.y + playerBody.halfHeight < enemy.y;

  if (falling && aboveEnemy) {
    enemy.stomp();
    player.setVelocityY(-280);
    onStomp();
  } else {
    onDamage();
  }
}
