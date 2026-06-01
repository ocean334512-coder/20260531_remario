import Phaser from 'phaser';

/** 그라데이션 하늘 + 원경 + 떠다니는 구름 */
export class SkyBackground {
  private readonly scene: Phaser.Scene;
  private readonly worldWidth: number;
  private readonly groundY: number;
  private skyGfx!: Phaser.GameObjects.Graphics;
  private sun!: Phaser.GameObjects.Arc;
  private sunGlow!: Phaser.GameObjects.Arc;
  private mountains: Phaser.GameObjects.Image[] = [];
  private cloudLayers: Phaser.GameObjects.Image[] = [];
  private birds: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, worldWidth: number, groundY: number) {
    this.scene = scene;
    this.worldWidth = worldWidth;
    this.groundY = groundY;
    this.build();
    scene.events.on('update', this.followCamera, this);
    scene.events.once('shutdown', () => {
      scene.events.off('update', this.followCamera, this);
    });
  }

  private build(): void {
    const cam = this.scene.cameras.main;

    this.skyGfx = this.scene.add.graphics().setDepth(-100).setScrollFactor(0);

    this.sunGlow = this.scene.add
      .circle(0, 0, 52, 0xfff4a8, 0.35)
      .setDepth(-98)
      .setScrollFactor(0);
    this.sun = this.scene.add
      .circle(0, 0, 28, 0xffe566, 1)
      .setDepth(-97)
      .setScrollFactor(0);
    this.scene.tweens.add({
      targets: [this.sun, this.sunGlow],
      scale: { from: 1, to: 1.06 },
      duration: 2800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const mountainCount = Math.ceil(this.worldWidth / 200) + 2;
    for (let i = 0; i < mountainCount; i += 1) {
      const m = this.scene.add.image(i * 200, this.groundY + 20, 'mountain-far');
      m.setOrigin(0.5, 1);
      m.setScrollFactor(0.08);
      m.setDepth(-90);
      m.setAlpha(0.75);
      m.setTint(0xb8daf0);
      this.mountains.push(m);
    }

    for (let layer = 0; layer < 3; layer += 1) {
      const scroll = 0.15 + layer * 0.12;
      const yBase = 40 + layer * 28;
      const count = Math.ceil(this.worldWidth / (160 - layer * 20)) + 2;
      for (let i = 0; i < count; i += 1) {
        const key = layer === 2 ? 'cloud-puff-lg' : 'cloud-puff';
        const x = i * (150 - layer * 15) + layer * 40;
        const y = yBase + (i % 3) * 18;
        const cloud = this.scene.add.image(x, y, key);
        cloud.setScrollFactor(scroll);
        cloud.setDepth(-80 + layer);
        cloud.setAlpha(0.55 + layer * 0.15);
        cloud.setScale(0.85 + layer * 0.12);
        this.cloudLayers.push(cloud);

        this.scene.tweens.add({
          targets: cloud,
          y: y + Phaser.Math.Between(4, 10),
          x: x + Phaser.Math.Between(-8, 8),
          duration: Phaser.Math.Between(4000, 7000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    for (let i = 0; i < 6; i += 1) {
      const bird = this.scene.add.image(
        Phaser.Math.Between(80, this.worldWidth - 80),
        Phaser.Math.Between(50, 140),
        'bird',
      );
      bird.setScrollFactor(0.25);
      bird.setDepth(-70);
      bird.setAlpha(0.55);
      this.birds.push(bird);
      this.animateBird(bird);
    }

    this.followCamera();
    void cam;
  }

  private animateBird(bird: Phaser.GameObjects.Image): void {
    const startX = bird.x;
    const distance = Phaser.Math.Between(120, 280);
    this.scene.tweens.add({
      targets: bird,
      x: startX + distance,
      y: bird.y + Phaser.Math.Between(-20, 20),
      duration: Phaser.Math.Between(6000, 11000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onYoyo: () => {
        bird.setFlipX(!bird.flipX);
      },
    });
    this.scene.tweens.add({
      targets: bird,
      y: bird.y - 6,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private followCamera = (): void => {
    const cam = this.scene.cameras.main;
    const w = cam.width;
    const h = cam.height;
    const x = cam.scrollX;
    const y = cam.scrollY;

    this.skyGfx.clear();
    this.skyGfx.fillGradientStyle(0x1e5fa8, 0x3d8fd4, 0x6eb5f0, 0x9ed4fa, 1);
    this.skyGfx.fillRect(x, y, w, h * 0.72);
    this.skyGfx.fillGradientStyle(0x6eb5f0, 0x6eb5f0, 0x9ed4fa, 0xc8ebff, 1);
    this.skyGfx.fillRect(x, y + h * 0.45, w, h * 0.55);

    const sunX = x + w * 0.78;
    const sunY = y + h * 0.16;
    this.sun.setPosition(sunX, sunY);
    this.sunGlow.setPosition(sunX, sunY);
  };
}
