import Phaser from 'phaser';
import { getAudio } from '../systems/AudioManager';
import type { Player } from './Player';

export class FlagPole extends Phaser.GameObjects.Container {
  private flagCloth: Phaser.GameObjects.Image;
  private poleTop: Phaser.GameObjects.Zone;
  private poleX: number;
  private groundY: number;
  private sliding = false;
  private onComplete: () => void;

  constructor(
    scene: Phaser.Scene,
    poleX: number,
    poleTopY: number,
    groundY: number,
    onComplete: () => void,
  ) {
    super(scene, poleX, 0);
    this.poleX = poleX;
    this.groundY = groundY;
    this.onComplete = onComplete;

    const poleHeight = groundY - poleTopY + 16;
    const poleCount = Math.ceil(poleHeight / 48);

    for (let i = 0; i < poleCount; i += 1) {
      const segment = scene.add.image(0, poleTopY + i * 48, 'flag-pole');
      segment.setOrigin(0.5, 0);
      this.add(segment);
    }

    this.flagCloth = scene.add.image(14, poleTopY + 4, 'flag-cloth');
    this.flagCloth.setOrigin(0, 0);
    this.add(this.flagCloth);

    this.poleTop = scene.add.zone(poleX, poleTopY + 24, 36, 56);
    scene.physics.add.existing(this.poleTop, true);
    this.setDepth(8);
    scene.add.existing(this);
  }

  getTopZone(): Phaser.GameObjects.Zone {
    return this.poleTop;
  }

  isSliding(): boolean {
    return this.sliding;
  }

  tryStartSlide(player: Player): boolean {
    if (this.sliding || player.isDead || player.inputLocked) return false;

    const body = player.body as Phaser.Physics.Arcade.Body;
    const nearTop = player.y < this.groundY - 80;
    const fallingOntoPole = body.velocity.y > 0 && nearTop;
    const jumpingUp = body.velocity.y <= 0;
    if (!body.onFloor() && !fallingOntoPole && !jumpingUp) return false;

    const distX = Math.abs(player.x - this.poleX);
    if (distX > 52) return false;

    this.sliding = true;
    player.startFlagSlide();

    const targetY = this.groundY - 18;
    const flagStartY = this.flagCloth.y;

    this.scene.tweens.add({
      targets: player,
      x: this.poleX,
      duration: 300,
      ease: 'Sine.easeOut',
      onComplete: () => {
        player.setVelocity(0, 0);

        const slideStartY = player.y;
        const slideDistance = targetY - slideStartY;

        this.scene.tweens.add({
          targets: player,
          y: targetY,
          duration: 1500,
          ease: 'Linear',
          onUpdate: () => {
            const progress =
              slideDistance === 0
                ? 1
                : Phaser.Math.Clamp((player.y - slideStartY) / slideDistance, 0, 1);
            this.flagCloth.y = flagStartY + progress * (targetY - flagStartY - 12);
          },
          onComplete: () => {
            getAudio(this.scene)?.playStageClear();
            this.onComplete();
          },
        });
      },
    });

    return true;
  }
}
