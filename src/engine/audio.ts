import { TeamId } from '../types';

class ArcadeAudio {
  private ctx: AudioContext | null = null;
  public muted = false;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainValue = 0.16,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainValue, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playCountdown(isGo: boolean) {
    if (isGo) {
      this.playTone(880, 0.28, 'sawtooth', 0.14, 0, 1175);
      this.playTone(587, 0.25, 'triangle', 0.14, 0.05);
    } else {
      this.playTone(440, 0.16, 'triangle', 0.16);
    }
  }

  public playCorrect(streak: number) {
    const base = 523.25 * Math.pow(1.06, Math.min(streak, 8));
    this.playTone(base, 0.11, 'triangle', 0.16, 0);
    this.playTone(base * 1.25, 0.16, 'sine', 0.15, 0.06);
    // Subtle engine rev
    this.playTone(130, 0.12, 'sawtooth', 0.05, 0, 220);
  }

  public playWrong() {
    this.playTone(260, 0.16, 'sawtooth', 0.13, 0, 140);
    this.playTone(190, 0.22, 'square', 0.08, 0.09, 110);
  }

  public playTurbo(team: TeamId) {
    if (team === 'doggy') {
      // Playful energetic bark-like double chirp + rocket whoosh!
      this.playTone(320, 0.09, 'sawtooth', 0.16, 0, 560);
      this.playTone(380, 0.11, 'sawtooth', 0.16, 0.1, 680);
      this.playTone(523, 0.32, 'triangle', 0.15, 0.18, 1046);
    } else {
      // Shimmering rainbow synth sweep for Supersonic Sloth!
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((n, idx) => {
        this.playTone(n, 0.18, 'sine', 0.14, idx * 0.055);
      });
    }
  }

  public playLapComplete() {
    this.playTone(659.25, 0.12, 'triangle', 0.15, 0);
    this.playTone(783.99, 0.12, 'triangle', 0.15, 0.09);
    this.playTone(1046.5, 0.22, 'triangle', 0.17, 0.18);
  }

  public playVictory() {
    const melody = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 659.25, d: 0.12, t: 0.11 },
      { f: 783.99, d: 0.12, t: 0.22 },
      { f: 1046.5, d: 0.35, t: 0.33 },
      { f: 783.99, d: 0.12, t: 0.55 },
      { f: 1046.5, d: 0.45, t: 0.67 },
    ];
    for (const m of melody) {
      this.playTone(m.f, m.d, 'triangle', 0.17, m.t);
    }
  }

  public playCoin() {
    this.playTone(987.77, 0.08, 'sine', 0.15, 0);
    this.playTone(1318.51, 0.22, 'sine', 0.15, 0.07);
  }
}

export const arcadeAudio = new ArcadeAudio();
