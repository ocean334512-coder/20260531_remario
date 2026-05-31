import Phaser from 'phaser';

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  life: number;
};

const COLORS = [0xff1744, 0xffeb3b, 0x00e676, 0x2979ff, 0xe040fb, 0xff9100, 0xffffff];

/** 화면 고정 불꽃놀이 (스테이지 클리어) */
export class Fireworks {
  private readonly scene: Phaser.Scene;
  private readonly gfx: Phaser.GameObjects.Graphics;
  private sparks: Spark[] = [];
  private burstTimer?: Phaser.Time.TimerEvent;
  private active = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(2500);
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.spawnBurst();
    this.burstTimer = this.scene.time.addEvent({
      delay: 550,
      loop: true,
      callback: () => this.spawnBurst(),
    });
  }

  stop(): void {
    this.active = false;
    this.burstTimer?.remove();
    this.burstTimer = undefined;
    this.sparks = [];
    this.gfx.clear();
  }

  destroy(): void {
    this.stop();
    this.gfx.destroy();
  }

  update(_time: number, delta: number): void {
    if (!this.active) return;

    const dt = delta / 1000;
    this.gfx.clear();

    this.sparks = this.sparks.filter((spark) => {
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vy += 140 * dt;
      spark.life -= dt * 0.85;

      if (spark.life <= 0) return false;

      const alpha = Phaser.Math.Clamp(spark.life, 0, 1);
      this.gfx.fillStyle(spark.color, alpha);
      this.gfx.fillCircle(spark.x, spark.y, 3 + alpha * 2);
      return true;
    });
  }

  private spawnBurst(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const cx = Phaser.Math.Between(Math.floor(w * 0.12), Math.floor(w * 0.88));
    const cy = Phaser.Math.Between(Math.floor(h * 0.1), Math.floor(h * 0.45));
    const color = Phaser.Utils.Array.GetRandom(COLORS);
    const count = Phaser.Math.Between(18, 28);

    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.08, 0.08);
      const speed = Phaser.Math.Between(90, 200);
      this.sparks.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: Phaser.Math.FloatBetween(0.7, 1.2),
      });
    }
  }
}
