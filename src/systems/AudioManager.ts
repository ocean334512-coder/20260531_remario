/**
 * Web Audio — 부드러운 BGM + 선명한 효과음 (외부 파일 없음)
 */
import Phaser from 'phaser';
import { AUDIO_UNLOCK_EVENT } from '../services/gameAudio';

const STEP_MS = 168; // 느린 템포 (~90 BPM 느낌)

/** 부드러운 아르페지오 (중저역, 고음 없음) */
const ARP_LOOP = [
  261, 0, 329, 0, 392, 0, 329, 0,
  294, 0, 349, 0, 392, 0, 349, 0,
  220, 0, 261, 0, 329, 0, 261, 0,
  174, 0, 220, 0, 261, 0, 220, 0,
  261, 0, 392, 0, 440, 0, 392, 0,
  329, 0, 294, 0, 261, 0, 220, 0,
  196, 0, 261, 0, 329, 0, 261, 0,
  174, 0, 196, 0, 220, 0, 196, 0,
];

const SOFT_BASS = [
  65, 0, 0, 0, 0, 0, 0, 0,
  73, 0, 0, 0, 0, 0, 0, 0,
  55, 0, 0, 0, 0, 0, 0, 0,
  43, 0, 0, 0, 0, 0, 0, 0,
  65, 0, 0, 0, 0, 0, 0, 0,
  73, 0, 0, 0, 0, 0, 0, 0,
  55, 0, 0, 0, 0, 0, 0, 0,
  43, 0, 0, 0, 0, 0, 0, 0,
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

  isUnlocked(): boolean {
    return this.unlocked;
  }

  ensureBgmPlaying(): void {
    if (!this.unlocked) return;
    void this.resumeContext();
    if (!this.bgmPlaying) this.startBgm();
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

    const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.bgmBus = this.ctx.createGain();
    this.bgmFilter = this.ctx.createBiquadFilter();
    this.sfxBus = this.ctx.createGain();

    this.master.gain.value = 0.58;
    this.bgmBus.gain.value = 0.14;
    this.sfxBus.gain.value = 0.52;

    this.bgmFilter.type = 'lowpass';
    this.bgmFilter.frequency.value = 1800;
    this.bgmFilter.Q.value = 0.5;

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
    this.playSweep(300, 620, 0.09, 'sine', 0.38);
    this.playNoise(0.03, 2000, 0.08);
  }

  playCoin(): void {
    this.playTone(988, 0.05, 'sine', 0.34);
    this.scheduleTone(1318, 0.07, 'sine', 0.3, 0.05);
    this.scheduleTone(1568, 0.09, 'sine', 0.24, 0.1);
  }

  /** 적 밟기 — 뚜렷한 '뽁' 소리 */
  playStomp(): void {
    this.playSweep(640, 140, 0.11, 'sine', 0.72);
    this.scheduleTone(200, 0.09, 'sine', 0.5, 0.03);
    this.scheduleTone(320, 0.06, 'triangle', 0.42, 0.05);
    this.playNoise(0.045, 650, 0.5);
  }

  playHurt(): void {
    this.playSweep(280, 80, 0.13, 'triangle', 0.36);
    this.scheduleTone(160, 0.1, 'sine', 0.28, 0.07);
  }

  playGameOver(): void {
    this.stopBgm();
    this.playSweep(392, 120, 0.22, 'sine', 0.32);
    this.scheduleTone(294, 0.24, 'sine', 0.28, 0.16);
    this.scheduleTone(196, 0.38, 'sine', 0.24, 0.34);
  }

  playStageClear(): void {
    const notes = [392, 494, 587, 784, 988];
    notes.forEach((freq, i) => {
      this.scheduleTone(freq, 0.16, 'sine', 0.28 - i * 0.03, i * 0.1);
    });
  }

  private startBgm(): void {
    if (!this.ctx || this.bgmPlaying) return;
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

    if (step % 16 === 0) this.playSoftKick(t);
    if (step % 16 === 8) this.playSoftKick(t, 0.12);

    const arp = ARP_LOOP[step] ?? 0;
    if (arp > 0) this.playArp(t, arp);

    const bass = SOFT_BASS[step] ?? 0;
    if (bass > 0) this.playSoftBass(t, bass);

    if (step % 16 === 0) this.playSoftPad(t, step);

    this.bgmStep += 1;
  }

  private playSoftKick(time: number, volume = 0.18): void {
    if (!this.ctx || !this.bgmBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.12);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
    osc.connect(gain);
    gain.connect(this.bgmBus);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  private playArp(time: number, freq: number): void {
    this.toneAt(time, freq, 0.2, 'sine', 0.055, this.bgmBus!, freq, 0.02);
  }

  private playSoftBass(time: number, freq: number): void {
    this.toneAt(time, freq, 0.22, 'sine', 0.07, this.bgmBus!, freq, 0.015);
  }

  private playSoftPad(time: number, step: number): void {
    const bar = Math.floor(step / 16) % 4;
    const chords = [
      [196.0, 261.63, 329.63],
      [146.83, 196.0, 246.94],
      [164.81, 196.0, 246.94],
      [130.81, 164.81, 196.0],
    ];
    const notes = chords[bar] ?? chords[0];
    for (const freq of notes) {
      this.toneAt(time, freq, 0.5, 'sine', 0.028, this.bgmBus!, freq, 0.04);
    }
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
