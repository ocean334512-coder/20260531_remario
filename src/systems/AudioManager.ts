/**
 * Web Audio — 신나는 BGM + 타격감 SFX
 */
import Phaser from 'phaser';
import { AUDIO_UNLOCK_EVENT } from '../services/gameAudio';

const STEP_MS = 118; // ~128 BPM

/** 신나는 멜로디 루프 */
const MELODY = [
  523, 659, 784, 988, 784, 659, 523, 659,
  698, 880, 1047, 880, 698, 587, 523, 392,
  440, 523, 659, 784, 659, 523, 440, 392,
  523, 659, 784, 988, 1175, 988, 784, 659,
  523, 659, 784, 988, 784, 659, 523, 659,
  698, 880, 1047, 880, 698, 587, 523, 392,
  440, 523, 659, 784, 880, 784, 659, 523,
  392, 494, 587, 698, 784, 698, 587, 494,
];

const BASS = [
  131, 131, 0, 131, 98, 98, 0, 98,
  110, 110, 0, 110, 87, 87, 0, 87,
  98, 98, 0, 98, 131, 131, 0, 131,
  98, 98, 0, 98, 110, 110, 0, 110,
  131, 131, 0, 131, 98, 98, 0, 98,
  110, 110, 0, 110, 87, 87, 0, 87,
  98, 98, 0, 98, 131, 131, 0, 131,
  87, 87, 0, 87, 98, 98, 0, 98,
];

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bgmBus: GainNode | null = null;
  private bgmFilter: BiquadFilterNode | null = null;
  private sfxBus: GainNode | null = null;
  private unlocked = false;
  private bgmPlaying = false;
  private bgmStep = 0;
  private bgmTimer: ReturnType<typeof setInterval> | null = null;
  private globalUnlockHandler: (() => void) | null = null;
  private lastFootstepAt = 0;

  isUnlocked(): boolean {
    return this.unlocked;
  }

  ensureBgmPlaying(): void {
    if (!this.unlocked) return;
    void this.resumeContext();
    if (!this.bgmPlaying || this.bgmTimer === null) {
      this.bgmPlaying = false;
      this.startBgm();
    }
  }

  bindGlobalUnlock(): void {
    if (this.globalUnlockHandler) return;
    this.globalUnlockHandler = () => {
      void this.unlock();
    };
    window.addEventListener(AUDIO_UNLOCK_EVENT, this.globalUnlockHandler);
  }

  dispose(): void {
    this.stopBgm();
    if (this.globalUnlockHandler) {
      window.removeEventListener(AUDIO_UNLOCK_EVENT, this.globalUnlockHandler);
      this.globalUnlockHandler = null;
    }
    if (this.ctx) {
      void this.ctx.close();
    }
    this.ctx = null;
    this.master = null;
    this.bgmBus = null;
    this.bgmFilter = null;
    this.sfxBus = null;
    this.unlocked = false;
  }

  async unlock(): Promise<void> {
    if (this.unlocked && this.ctx) {
      await this.resumeContext();
      this.ensureBgmPlaying();
      return;
    }

    const Ctx =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;

    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.bgmBus = this.ctx.createGain();
    this.bgmFilter = this.ctx.createBiquadFilter();
    this.sfxBus = this.ctx.createGain();

    this.master.gain.value = 0.65;
    this.bgmBus.gain.value = 0.28;
    this.sfxBus.gain.value = 0.62;

    this.bgmFilter.type = 'lowpass';
    this.bgmFilter.frequency.value = 5200;
    this.bgmFilter.Q.value = 0.4;

    this.bgmBus.connect(this.bgmFilter);
    this.bgmFilter.connect(this.master);
    this.sfxBus.connect(this.master);
    this.master.connect(this.ctx.destination);

    await this.resumeContext();

    this.unlocked = true;
    this.startBgm();
  }

  private async resumeContext(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        /* ignore */
      }
    }
  }

  playJump(): void {
    this.playSweep(220, 520, 0.1, 'square', 0.45);
    this.scheduleTone(660, 0.06, 'square', 0.32, 0.04);
    this.playNoise(0.025, 2400, 0.12);
  }

  playLand(): void {
    this.playTone(120, 0.08, 'sine', 0.42, 60);
    this.playNoise(0.04, 350, 0.38);
  }

  playRunStep(now = performance.now()): void {
    if (now - this.lastFootstepAt < 160) return;
    this.lastFootstepAt = now;
    this.playTone(180, 0.04, 'triangle', 0.22);
    this.playNoise(0.02, 900, 0.14);
  }

  playCoin(): void {
    this.playTone(988, 0.05, 'square', 0.4);
    this.scheduleTone(1318, 0.06, 'square', 0.38, 0.05);
    this.scheduleTone(1568, 0.08, 'square', 0.34, 0.1);
    this.scheduleTone(1976, 0.1, 'sine', 0.26, 0.16);
  }

  playStomp(): void {
    this.playSweep(720, 120, 0.12, 'square', 0.78);
    this.scheduleTone(180, 0.1, 'sine', 0.55, 0.02);
    this.scheduleTone(440, 0.08, 'square', 0.48, 0.04);
    this.scheduleTone(880, 0.06, 'square', 0.35, 0.06);
    this.playNoise(0.06, 500, 0.55);
  }

  playHurt(): void {
    this.playSweep(300, 70, 0.14, 'sawtooth', 0.42);
    this.scheduleTone(140, 0.12, 'square', 0.3, 0.06);
  }

  playGameOver(): void {
    this.stopBgm();
    this.playSweep(440, 110, 0.22, 'triangle', 0.36);
    this.scheduleTone(330, 0.24, 'triangle', 0.3, 0.14);
    this.scheduleTone(196, 0.4, 'triangle', 0.26, 0.3);
  }

  playStageClear(): void {
    const notes = [523, 659, 784, 988, 1175, 1319, 1568];
    notes.forEach((freq, i) => {
      this.scheduleTone(freq, 0.14, 'square', 0.34 - i * 0.03, i * 0.08);
    });
  }

  private startBgm(): void {
    if (!this.ctx || !this.bgmBus) return;
    if (this.bgmPlaying && this.bgmTimer) return;

    this.stopBgm();
    this.bgmPlaying = true;
    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => this.tickBgm(), STEP_MS);
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
    const step = this.bgmStep % 64;
    const beat = step % 16;

    if (beat % 4 === 0) this.playKick(t);
    if (beat % 4 === 2) this.playSnare(t);
    if (beat % 2 === 1) this.playHiHat(t);

    const note = MELODY[step] ?? 0;
    if (note > 0) this.playMelody(t, note);

    const bass = BASS[step] ?? 0;
    if (bass > 0) this.playBass(t, bass);

    this.bgmStep += 1;
  }

  private playKick(time: number): void {
    if (!this.ctx || !this.bgmBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.09);
    gain.gain.setValueAtTime(0.38, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
    osc.connect(gain);
    gain.connect(this.bgmBus);
    osc.start(time);
    osc.stop(time + 0.13);
  }

  private playSnare(time: number): void {
    if (!this.bgmBus) return;
    this.playNoiseAt(time, 0.04, 1, 1800, 0.12, this.bgmBus);
  }

  private playHiHat(time: number): void {
    if (!this.bgmBus) return;
    this.playNoiseAt(time, 0.018, 1, 7000, 0.05, this.bgmBus);
  }

  private playMelody(time: number, freq: number): void {
    this.toneAt(time, freq, 0.1, 'square', 0.09, this.bgmBus!, freq, 0.004);
  }

  private playBass(time: number, freq: number): void {
    this.toneAt(time, freq, 0.12, 'triangle', 0.14, this.bgmBus!, freq, 0.006);
  }

  private playSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    if (!this.ctx || !this.sfxBus) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private playNoise(duration: number, filterFreq: number, peakGain: number): void {
    if (!this.ctx || !this.sfxBus) return;
    this.playNoiseAt(this.ctx.currentTime, duration, 1, filterFreq, peakGain, this.sfxBus);
  }

  private playNoiseAt(
    time: number,
    duration: number,
    volume: number,
    filterFreq: number,
    peakGain: number,
    dest: GainNode,
  ): void {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.2;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(time);
    src.stop(time + duration + 0.01);
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFreq = freq,
    attack = 0.008,
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

export function getOrCreateAudio(registry: Phaser.Data.DataManager): AudioManager {
  let audio = registry.get('audio') as AudioManager | undefined;
  if (!audio) {
    audio = new AudioManager();
    registry.set('audio', audio);
  }
  return audio;
}

export function getAudio(scene: Phaser.Scene): AudioManager | undefined {
  return scene.registry.get('audio') as AudioManager | undefined;
}

export function setupAudioForScene(scene: Phaser.Scene): AudioManager {
  const audio = getOrCreateAudio(scene.registry);

  const tryUnlock = (): void => {
    void audio.unlock();
  };

  if (!audio.isUnlocked()) {
    scene.input.once('pointerdown', tryUnlock);
    scene.input.keyboard?.once('keydown', tryUnlock);
    audio.bindGlobalUnlock();
  } else {
    audio.ensureBgmPlaying();
  }

  return audio;
}

export function teardownGameAudio(registry: Phaser.Data.DataManager): void {
  const audio = registry.get('audio') as AudioManager | undefined;
  audio?.dispose();
  registry.remove('audio');
}
