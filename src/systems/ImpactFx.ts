import Phaser from 'phaser';

/** 이동·착지·적 처치 등 시각 임팩트 */
export class ImpactFx {
  static dustBurst(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options?: { count?: number; color?: number; spread?: number },
  ): void {
    const count = options?.count ?? 6;
    const color = options?.color ?? 0xe8dcc8;
    const spread = options?.spread ?? 1;

    for (let i = 0; i < count; i += 1) {
      const dot = scene.add.circle(
        x + Phaser.Math.Between(-4, 4),
        y,
        Phaser.Math.Between(2, 4),
        color,
        0.85,
      );
      dot.setDepth(45);
      const angle = Phaser.Math.FloatBetween(-Math.PI * 0.9, -Math.PI * 0.1);
      const dist = Phaser.Math.Between(14, 36) * spread;
      scene.tweens.add({
        targets: dot,
        x: dot.x + Math.cos(angle) * dist,
        y: dot.y + Math.sin(angle) * dist * 0.35 + 6,
        alpha: 0,
        scaleX: 0.15,
        scaleY: 0.15,
        duration: Phaser.Math.Between(180, 320),
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  static runTrail(
    scene: Phaser.Scene,
    x: number,
    y: number,
    flipX: boolean,
  ): void {
    const puff = scene.add.ellipse(
      x + (flipX ? 8 : -8),
      y + 4,
      10,
      4,
      0xffffff,
      0.35,
    );
    puff.setDepth(44);
    scene.tweens.add({
      targets: puff,
      alpha: 0,
      scaleX: 1.8,
      scaleY: 0.5,
      duration: 220,
      onComplete: () => puff.destroy(),
    });
  }

  static enemyDefeat(scene: Phaser.Scene, x: number, y: number): void {
    const flash = scene.add.circle(x, y - 8, 22, 0xffffff, 0.75);
    flash.setDepth(55);
    scene.tweens.add({
      targets: flash,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 160,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    const colors = [0xffeb3b, 0xff6b6b, 0xffffff, 0x5c94fc];
    for (let i = 0; i < 14; i += 1) {
      const star = scene.add.star(
        x,
        y - 6,
        4,
        3,
        6,
        colors[i % colors.length]!,
        1,
      );
      star.setDepth(56);
      const angle = (i / 14) * Math.PI * 2;
      const dist = Phaser.Math.Between(28, 52);
      scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * dist,
        y: y - 6 + Math.sin(angle) * dist * 0.6,
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        scale: 0.2,
        duration: Phaser.Math.Between(280, 450),
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy(),
      });
    }

    const ring = scene.add.circle(x, y - 4, 6, 0xffeb3b, 0);
    ring.setStrokeStyle(3, 0xffeb3b, 0.9);
    ring.setDepth(54);
    scene.tweens.add({
      targets: ring,
      scaleX: 3.5,
      scaleY: 2,
      alpha: 0,
      duration: 280,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    scene.cameras.main.shake(140, 0.006);
  }

  static landImpact(scene: Phaser.Scene, x: number, y: number): void {
    ImpactFx.dustBurst(scene, x, y + 2, { count: 8, spread: 1.2 });
    scene.cameras.main.shake(80, 0.0025);
  }

  static coinSparkle(scene: Phaser.Scene, x: number, y: number): void {
    for (let i = 0; i < 5; i += 1) {
      const s = scene.add.star(x, y, 4, 2, 5, 0xffeb3b, 1);
      s.setDepth(48);
      scene.tweens.add({
        targets: s,
        y: y - Phaser.Math.Between(12, 28),
        alpha: 0,
        scale: 0.3,
        duration: 300,
        delay: i * 30,
        onComplete: () => s.destroy(),
      });
    }
  }
}
