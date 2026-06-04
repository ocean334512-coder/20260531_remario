import Phaser from 'phaser';
import { TILE_SIZE, STAGE1, STAGE1_DECOR, parseStage } from '../levels/stage1';
import { spawnDecorations, addBackgroundHills } from '../assets/decorAssets';
import { SkyBackground } from '../systems/SkyBackground';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { PlatformJumperEnemy } from '../entities/PlatformJumperEnemy';
import { ThrowerEnemy } from '../entities/ThrowerEnemy';
import { FlyerEnemy } from '../entities/FlyerEnemy';
import { HopperEnemy } from '../entities/HopperEnemy';
import { FlagPole } from '../entities/FlagPole';
import { handlePlayerEnemyCollision } from '../systems/CollisionHandler';
import { getAudio, setupAudioForScene } from '../systems/AudioManager';
import { ImpactFx } from '../systems/ImpactFx';
import type { TouchControls } from '../systems/TouchControls';
import { recordStagePlay } from '../services/playCountService';
import { clampProgressM, pixelsToMeters } from '../utils/distance';

export class GameScene extends Phaser.Scene {
  player!: Player;
  stageTotalM = 0;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private walkers!: Phaser.Physics.Arcade.Group;
  private throwers!: Phaser.Physics.Arcade.Group;
  private hoppers!: Phaser.Physics.Arcade.Group;
  private flyers!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private flagPole!: FlagPole;
  private spawnX = 0;
  private spawnY = 0;
  private worldWidth = 0;
  private worldHeight = 0;
  private isGameOver = false;
  private isStageClear = false;
  private touchControls: TouchControls | null = null;
  private maxProgressM = 0;
  private runStartAt = 0;
  private runStopped = false;
  private bgmWatchAt = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    recordStagePlay(this);
    this.isGameOver = false;
    this.isStageClear = false;

    const {
      width,
      height,
      spawnX,
      spawnY,
      groundRow,
      flagX,
      flagTopY,
      groundY,
    } = parseStage(STAGE1);

    this.spawnX = spawnX;
    this.spawnY = spawnY;
    this.worldWidth = width * TILE_SIZE;
    this.worldHeight = height * TILE_SIZE;
    this.stageTotalM = pixelsToMeters(flagX - spawnX);
    this.maxProgressM = 0;
    this.runStartAt = this.time.now;
    this.runStopped = false;
    this.registry.set('runStartAt', this.runStartAt);
    this.registry.set('runStopped', false);

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight + 200);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight + 200);
    this.cameras.main.setBackgroundColor('#6eb5f0');

    new SkyBackground(this, this.worldWidth, groundRow * TILE_SIZE);

    this.platforms = this.physics.add.staticGroup();
    this.walkers = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.throwers = this.physics.add.group({ classType: ThrowerEnemy, runChildUpdate: true });
    this.hoppers = this.physics.add.group({ classType: HopperEnemy, runChildUpdate: true });
    this.flyers = this.physics.add.group({ classType: FlyerEnemy, runChildUpdate: true });
    this.projectiles = this.physics.add.group();
    this.registry.set('projectiles', this.projectiles);
    this.coins = this.physics.add.group();

    addBackgroundHills(this, width * TILE_SIZE, groundRow * TILE_SIZE);
    spawnDecorations(this, STAGE1_DECOR, TILE_SIZE, groundRow);
    this.buildLevel(STAGE1);
    this.registry.set('platforms', this.platforms);

    this.flagPole = new FlagPole(
      this,
      flagX,
      flagTopY,
      groundY,
      () => this.finishStageClear(),
    );

    this.player = new Player(this, spawnX, spawnY - 64);
    this.bindTouchControls();

    this.physics.add.collider(
      this.player,
      this.platforms,
      undefined,
      this.canCollideWithPlatform,
    );
    this.physics.add.collider(this.walkers, this.platforms);
    this.physics.add.collider(this.throwers, this.platforms);
    this.physics.add.collider(this.hoppers, this.platforms);
    this.physics.add.collider(this.projectiles, this.platforms, (proj) => {
      (proj as Phaser.Physics.Arcade.Sprite).destroy();
    });

    const onEnemyHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (p, e) => {
      if (this.player.inputLocked || this.isStageClear) return;
      handlePlayerEnemyCollision(
        p as Phaser.Types.Physics.Arcade.GameObjectWithBody,
        e as Phaser.Types.Physics.Arcade.GameObjectWithBody,
        () => {
          const enemy = e as Enemy;
          ImpactFx.enemyDefeat(this, enemy.x, enemy.y);
          this.addScore(200);
          getAudio(this)?.playStomp();
        },
        () => this.damagePlayer(),
      );
    };

    this.physics.add.overlap(this.player, this.walkers, onEnemyHit);
    this.physics.add.overlap(this.player, this.throwers, onEnemyHit);
    this.physics.add.overlap(this.player, this.hoppers, onEnemyHit);
    this.physics.add.overlap(this.player, this.flyers, onEnemyHit);
    this.physics.add.overlap(this.player, this.projectiles, (_p, proj) => {
      if (this.player.inputLocked || this.isStageClear) return;
      (proj as Phaser.Physics.Arcade.Sprite).destroy();
      this.damagePlayer();
    });

    this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
      if (this.player.inputLocked) return;
      const coinSprite = coin as Phaser.Physics.Arcade.Sprite;
      ImpactFx.coinSparkle(this, coinSprite.x, coinSprite.y);
      coinSprite.disableBody(true, true);
      this.addScore(100);
      getAudio(this)?.playCoin();
    });

    this.physics.add.overlap(this.player, this.flagPole.getTopZone(), () => {
      if (!this.isStageClear && !this.flagPole.isSliding()) {
        this.flagPole.tryStartSlide(this.player);
      }
    });

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(120, 80);

    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R).on('down', () => {
      if (this.isGameOver || this.isStageClear) {
        this.restartGame();
      }
    });

    this.events.on('request-restart', () => {
      if (this.isGameOver || this.isStageClear) {
        this.restartGame();
      }
    });

    this.events.on(Phaser.Scenes.Events.PRE_UPDATE, (_time: number, delta: number) => {
      this.touchControls?.preUpdate();
      if (this.isGameOver || this.isStageClear) return;
      this.player.handleJumpBeforePhysics(delta);
    });

    setupAudioForScene(this);

    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }
  }

  update(): void {
    if (this.time.now - this.bgmWatchAt > 2500) {
      getAudio(this)?.ensureBgmPlaying();
      this.bgmWatchAt = this.time.now;
    }

    if (this.isGameOver) return;
    if (this.isStageClear && !this.player.inputLocked) return;

    if (!this.player.inputLocked) {
      this.player.updateMovement();
    }

    if (!this.isStageClear) {
      const progressM = this.getProgressMeters();
      this.maxProgressM = Math.max(this.maxProgressM, progressM);
      this.events.emit('progress-changed', progressM, this.stageTotalM);
    }

    if (!this.isStageClear && this.player.y > this.worldHeight + 64) {
      this.damagePlayer(true);
    }

    this.cleanupFallenEnemies();
  }

  getProgressMeters(playerX = this.player.x): number {
    return clampProgressM(pixelsToMeters(playerX - this.spawnX), this.stageTotalM);
  }

  getElapsedMs(): number {
    if (this.runStopped) {
      return (this.registry.get('runElapsedMs') as number) ?? 0;
    }
    return Math.max(0, this.time.now - this.runStartAt);
  }

  private cleanupFallenEnemies(): void {
    const pitY = this.worldHeight + 48;
    const removeFallen = (group: Phaser.Physics.Arcade.Group): void => {
      group.getChildren().forEach((child) => {
        const enemy = child as Enemy;
        if (enemy.active && !enemy.isDead && enemy.y > pitY) {
          enemy.destroy();
        }
      });
    };
    removeFallen(this.walkers);
    removeFallen(this.throwers);
    removeFallen(this.hoppers);
  }

  private buildLevel(rows: string[]): void {
    for (let y = 0; y < rows.length; y += 1) {
      const row = rows[y] ?? '';
      for (let x = 0; x < row.length; x += 1) {
        const cell = row[x];
        if (cell === 'f') continue;

        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;

        if (cell === '#' || cell === '-') {
          const tile = this.platforms.create(px, py, 'ground');
          tile.setData('oneWay', cell === '-' || y < rows.length - 2);
          tile.refreshBody();
        } else if (cell === 'o') {
          const coin = this.coins.create(px, py, 'coin-sheet', 0) as Phaser.Physics.Arcade.Sprite;
          coin.setCircle(6);
          coin.play('coin-spin');
        } else if (cell === 'e') {
          this.walkers.create(px, py - 16);
        } else if (cell === 'p') {
          const jumper = new PlatformJumperEnemy(this, px, py - 16);
          this.walkers.add(jumper);
        } else if (cell === 'T') {
          this.throwers.create(px, py - 16);
        } else if (cell === 'H') {
          this.hoppers.create(px, py - 16);
        } else if (cell === 'A') {
          this.flyers.create(px, py);
        }
      }
    }
  }

  private canCollideWithPlatform: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    playerObj,
    platformObj,
  ) => {
    const platform = platformObj as Phaser.Physics.Arcade.Sprite;
    if (!platform.getData('oneWay')) return true;

    const playerBody = (playerObj as Player).body as Phaser.Physics.Arcade.Body;
    const platformBody = platform.body as Phaser.Physics.Arcade.StaticBody;

    return (
      playerBody.velocity.y >= 0 &&
      playerBody.bottom <= platformBody.top + 10
    );
  };

  private addScore(points: number): void {
    const score = (this.registry.get('score') as number) + points;
    this.registry.set('score', score);
    this.events.emit('score-changed', score);
  }

  private damagePlayer(fromPit = false): void {
    if (this.player.isInvincible || this.player.isDead || this.player.inputLocked) return;

    getAudio(this)?.playHurt();

    let lives = (this.registry.get('lives') as number) - 1;
    this.registry.set('lives', lives);
    this.events.emit('lives-changed', lives);

    if (lives <= 0) {
      this.gameOver();
      return;
    }

    this.events.emit('player-died', {
      progressM: this.maxProgressM,
      totalM: this.stageTotalM,
      final: false,
    });

    this.projectiles.clear(true, true);
    this.player.respawn(this.spawnX, this.spawnY - 64);
    this.player.blinkInvincible();

    if (fromPit) {
      this.cameras.main.flash(200, 255, 100, 100);
    }
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.runStopped = true;
    this.registry.set('runStopped', true);
    const elapsedMs = this.getElapsedMs();
    this.registry.set('runElapsedMs', elapsedMs);
    this.player.isDead = true;
    this.player.setVelocity(0, 0);
    getAudio(this)?.playGameOver();
    this.events.emit('player-died', {
      progressM: this.maxProgressM,
      totalM: this.stageTotalM,
      final: true,
      gameScore: this.registry.get('score') as number,
      elapsedMs,
    });
  }

  private finishStageClear(): void {
    if (this.isStageClear) return;
    this.isStageClear = true;
    this.player.setVelocity(0, 0);
    this.maxProgressM = this.stageTotalM;
    this.events.emit('stage-clear', {
      progressM: this.stageTotalM,
      totalM: this.stageTotalM,
    });
  }

  private restartGame(): void {
    this.registry.set('score', 0);
    this.registry.set('lives', 3);
    this.scene.restart();
    this.scene.get('UIScene').events.emit('reset-ui');
  }

  private bindTouchControls(): void {
    const fromRegistry = this.registry.get('touchControls') as TouchControls | undefined;
    if (fromRegistry) {
      this.touchControls = fromRegistry;
      this.player.bindTouchControls(fromRegistry);
      return;
    }
    this.time.delayedCall(0, () => {
      const tc = this.registry.get('touchControls') as TouchControls | undefined;
      if (tc) {
        this.touchControls = tc;
        this.player.bindTouchControls(tc);
      }
    });
  }
}
