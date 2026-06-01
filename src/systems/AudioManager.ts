/**
 * Web Audio — 세련된 아케이드/일렉트로닉 BGM + 타격감 SFX (외부 파일 없음)
 */
import Phaser from 'phaser';
import { AUDIO_UNLOCK_EVENT } from '../services/gameAudio';

const STEP_MS = 115; // ~130 BPM, 16분음표

/** 4마디 루프 멜로디 (0 = 쉼) — C → G → Am → F 진행 */
const LEAD_LOOP = [
  523, 659, 784, 659, 587, 659, 784, 988,
  880, 1047, 880, 784, 698, 784, 659, 587,
  659, 784, 880, 784, 698, 659, 587, 523,
  392, 494, 587, 698, 784, 698, 587, 494,
  523, 659, 784, 988, 784, 659, 523, 659,
  784, 880, 988, 880, 784, 698, 659, 587,
  698, 784, 880, 784, 698, 659, 587, 523,
  440, 523, 587, 659, 587, 523, 440, 392,
];

const BASS_LOOP = [
  65.41, 0, 65.41, 0, 82.41, 0, 65.41, 0,
  98.0, 0, 98.0, 0, 73.42, 0, 98.0, 0,
  110.0, 0, 110.0, 0, 87.31, 0, 110.0, 0,
  87.31, 0, 87.31, 0, 65.41, 0, 87.31, 0,
];

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bgmBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private unlocked = false;
  private bgmPlaying = false;
  private bgmStep = 0;
  private bgmTimer: ReturnType<typeof setInterval> | null = null;
  private globalUnlockHandler: (() => void) | null = null;

  isUnlocked(): boolean {
    return this.unlocked;
  }

  /** 게임 재시작·복귀 시 BGM 재개 */
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
    this.sfxBus = this.ctx.createGain();

    this.master.gain.value = 0.62;
    this.bgmBus.gain.value = 0.26;
    this.sfxBus.gain.value = 0.48;

    this.bgmBus.connect(this.master);
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
    this.playSweep(280, 720, 0.1, 'sine', 0.42);
    this.playNoise(0.035, 1800, 0.1);
  }

  playCoin(): void {
    this.playTone(1318, 0.06, 'sine', 0.32);
    this.scheduleTone(1760, 0.08, 'sine', 0.28, 0.05);
    this.scheduleTone(2093, 0.1, 'triangle', 0.22, 0.1);
  }

  playStomp(): void {
    this.playTone(95, 0.07, 'sine', 0.55, 45);
    this.playNoise(0.05, 400, 0.35);
  }

  playHurt(): void {
    this.playSweep(320, 90, 0.14, 'sawtooth', 0.38);
    this.scheduleTone(180, 0.12, 'square', 0.25, 0.08);
  }

  playGameOver(): void {
    this.stopBgm();
    this.playSweep(440, 130, 0.2, 'triangle', 0.35);
    this.scheduleTone(330, 0.22, 'triangle', 0.3, 0.15);
    this.scheduleTone(220, 0.4, 'triangle', 0.28, 0.32);
  }

  playStageClear(): void {
    const notes = [523, 659, 784, 988, 1175, 1319];
    notes.forEach((freq, i) => {
      this.scheduleTone(freq, 0.14, 'sine', 0.3 - i * 0.03, i * 0.09);
      this.scheduleTone(freq * 2, 0.08, 'triangle', 0.12, i * 0.09 + 0.04);
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
    const beat = step % 16;

    if (beat % 4 === 0) this.playKick(t);
    if (beat % 4 === 2) this.playSnare(t);
    if (beat % 2 === 1) this.playHiHat(t);

    const bass = BASS_LOOP[step] ?? 0;
    if (bass > 0) this.playBass(t, bass);

    const lead = LEAD_LOOP[step] ?? 0;
    if (lead > 0) this.playLead(t, lead);

    if (step % 16 === 0) this.playPadChord(t, step);

    this.bgmStep += 1;
  }

  private playKick(time: number): void {
    if (!this.ctx || !this.bgmBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);
    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(gain);
    gain.connect(this.bgmBus);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  private playSnare(time: number): void {
    if (!this.bgmBus) return;
    this.playNoiseAt(time, 0.045, 1, 1200, 0.14, this.bgmBus);
  }

  private playHiHat(time: number): void {
    if (!this.bgmBus) return;
    this.playNoiseAt(time, 0.02, 1, 6000, 0.06, this.bgmBus);
  }

  private playBass(time: number, freq: number): void {
    this.toneAt(time, freq, 0.1, 'sawtooth', 0.12, this.bgmBus!, freq * 0.98, 0.004);
  }

  private playLead(time: number, freq: number): void {
    this.toneAt(time, freq, 0.09, 'triangle', 0.1, this.bgmBus!, freq, 0.006);
  }

  private playPadChord(time: number, step: number): void {
    const bar = Math.floor(step / 16) % 4;
    const chords = [
      [261.63, 329.63, 392.0],
      [392.0, 493.88, 587.33],
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
    ];
    const notes = chords[bar] ?? chords[0];
    for (const freq of notes) {
      this.toneAt(time, freq, 0.35, 'sine', 0.04, this.bgmBus!, freq, 0.02);
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
    filter.type = 'highpass';
    filter.frequency.value = filterFreq;
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
