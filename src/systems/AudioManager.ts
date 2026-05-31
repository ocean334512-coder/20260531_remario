/** Web Audio 기반 8bit 스타일 BGM / SFX (외부 파일 불필요) */
import Phaser from 'phaser';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bgmBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private unlocked = false;
  private bgmPlaying = false;
  private bgmStep = 0;
  private bgmTimer: ReturnType<typeof setInterval> | null = null;

  private readonly melody = [
    523, 523, 523, 392, 440, 523, 440, 392,
    349, 392, 440, 392, 349, 330, 349, 392,
    440, 494, 523, 494, 440, 392, 349, 392,
  ];

  private readonly bass = [
    131, 131, 98, 98, 110, 110, 98, 98,
    87, 87, 98, 98, 87, 82, 87, 98,
    110, 123, 131, 123, 110, 98, 87, 98,
  ];

  unlock(): void {
    if (this.unlocked) return;

    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.bgmBus = this.ctx.createGain();
    this.sfxBus = this.ctx.createGain();

    this.master.gain.value = 0.55;
    this.bgmBus.gain.value = 0.22;
    this.sfxBus.gain.value = 0.4;

    this.bgmBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.master.connect(this.ctx.destination);

    this.unlocked = true;
    this.startBgm();
  }

  playJump(): void {
    this.playTone(420, 0.08, 'square', 0.35, 680, 0.04);
  }

  playCoin(): void {
    this.playTone(988, 0.04, 'square', 0.3);
    this.scheduleTone(1319, 0.05, 'square', 0.25, 0.05);
  }

  playStomp(): void {
    this.playTone(180, 0.06, 'square', 0.45, 90, 0.08);
  }

  playHurt(): void {
    this.playTone(220, 0.12, 'sawtooth', 0.35, 110, 0.06);
    this.scheduleTone(160, 0.15, 'sawtooth', 0.3, 0.1);
  }

  playGameOver(): void {
    this.stopBgm();
    this.playTone(392, 0.15, 'triangle', 0.35, 196, 0.1);
    this.scheduleTone(294, 0.2, 'triangle', 0.3, 0.18);
    this.scheduleTone(220, 0.35, 'triangle', 0.28, 0.35);
  }

  playStageClear(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.scheduleTone(freq, 0.18, 'square', 0.28 - i * 0.03, i * 0.12);
    });
  }

  private startBgm(): void {
    if (!this.ctx || this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => this.tickBgm(), 170);
  }

  private stopBgm(): void {
    this.bgmPlaying = false;
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private tickBgm(): void {
    if (!this.ctx || !this.bgmBus) return;

    const t = this.ctx.currentTime;
    const i = this.bgmStep % this.melody.length;
    const note = this.melody[i] ?? 0;
    const bass = this.bass[i] ?? 0;

    if (note > 0) {
      this.toneAt(t, note, 0.11, 'square', 0.045, this.bgmBus);
    }
    if (bass > 0) {
      this.toneAt(t, bass, 0.14, 'triangle', 0.07, this.bgmBus);
    }

    this.bgmStep += 1;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFreq = freq,
    attack = 0.01,
  ): void {
    if (!this.ctx || !this.sfxBus) return;
    this.toneAt(this.ctx.currentTime, freq, duration, type, volume, this.sfxBus, endFreq, attack);
  }

  private scheduleTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay: number,
    endFreq = freq,
  ): void {
    if (!this.ctx || !this.sfxBus) return;
    this.toneAt(
      this.ctx.currentTime + delay,
      freq,
      duration,
      type,
      volume,
      this.sfxBus,
      endFreq,
    );
  }

  private toneAt(
    start: number,
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    dest: GainNode,
    endFreq = freq,
    attack = 0.008,
  ): void {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), start + duration);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
}

export function getAudio(scene: Phaser.Scene): AudioManager | undefined {
  return scene.registry.get('audio') as AudioManager | undefined;
}
