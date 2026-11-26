import { TeamId } from '../types';

interface RadioTrack {
  bpm: number;
  leadType: OscillatorType;
  bassType: OscillatorType;
  leadNotes: (number | null)[];
  bassNotes: (number | null)[];
}

// Note frequencies in Hz
const N = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  Fs4: 369.99,
  G4: 392.0,
  A4: 440.0,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
};

const RADIO_TRACKS: Record<string, RadioTrack> = {
  'radio-pop': {
    bpm: 132,
    leadType: 'triangle',
    bassType: 'sine',
    leadNotes: [
      N.C5, null, N.E5, N.G5, N.E5, null, N.D5, N.C5,
      N.A4, null, N.C5, N.E5, N.D5, null, N.C5, null,
      N.F5, null, N.E5, N.D5, N.C5, N.D5, N.E5, null,
      N.G5, N.E5, N.D5, N.C5, N.D5, null, N.C5, null,
    ],
    bassNotes: [
      N.C3, null, N.G3, null, N.C3, null, N.G3, null,
      N.A3, null, N.E3, null, N.A3, null, N.E3, null,
      N.F3, null, N.C3, null, N.F3, null, N.C3, null,
      N.G3, null, N.D3, null, N.G3, null, N.G3, null,
    ],
  },
  'radio-chiptune': {
    bpm: 152,
    leadType: 'square',
    bassType: 'triangle',
    leadNotes: [
      N.E5, N.G5, N.E5, N.C5, N.D5, N.E5, null, N.G5,
      N.A5, N.G5, N.E5, N.D5, N.C5, null, N.E5, null,
      N.F5, N.A5, N.G5, N.F5, N.E5, N.G5, N.F5, N.E5,
      N.D5, N.E5, N.F5, N.G5, N.C5, null, null, null,
    ],
    bassNotes: [
      N.C3, N.C3, N.G3, N.C3, N.C3, N.C3, N.G3, N.C3,
      N.A3, N.A3, N.E3, N.A3, N.A3, N.E3, N.G3, N.E3,
      N.F3, N.F3, N.C3, N.F3, N.C3, N.C3, N.G3, N.C3,
      N.G3, N.G3, N.D3, N.G3, N.C3, null, N.G3, null,
    ],
  },
  'radio-tropical': {
    bpm: 124,
    leadType: 'sine',
    bassType: 'triangle',
    leadNotes: [
      N.G4, N.C5, null, N.E5, null, N.G5, N.E5, N.D5,
      N.C5, null, N.A4, N.C5, N.E5, null, N.D5, null,
      N.F4, N.A4, null, N.C5, null, N.F5, N.E5, N.D5,
      N.E5, N.D5, N.C5, null, N.G4, null, N.C5, null,
    ],
    bassNotes: [
      N.C3, null, null, N.G3, N.C3, null, N.G3, null,
      N.A3, null, null, N.E3, N.A3, null, N.E3, null,
      N.F3, null, null, N.C3, N.F3, null, N.C3, null,
      N.G3, null, null, N.D3, N.G3, null, N.C3, null,
    ],
  },
  'radio-rock': {
    bpm: 144,
    leadType: 'sawtooth',
    bassType: 'sawtooth',
    leadNotes: [
      N.E4, null, N.G4, N.A4, N.G4, null, N.E4, N.D4,
      N.E4, null, N.G4, N.A4, N.B4, null, N.A4, null,
      N.C5, null, N.B4, N.A4, N.G4, null, N.A4, N.B4,
      N.E5, N.D5, N.B4, N.A4, N.G4, null, N.E4, null,
    ],
    bassNotes: [
      N.E3, N.E3, N.E3, null, N.G3, N.G3, N.A3, null,
      N.E3, N.E3, N.E3, null, N.B3, N.B3, N.A3, null,
      N.C3, N.C3, N.C3, null, N.D3, N.D3, N.D3, null,
      N.E3, N.E3, N.D3, N.B3, N.E3, null, N.E3, null,
    ],
  },
  'radio-disco': {
    bpm: 136,
    leadType: 'triangle',
    bassType: 'square',
    leadNotes: [
      N.C5, N.G4, N.E5, N.C5, N.G5, N.E5, N.D5, N.C5,
      N.A4, N.E4, N.C5, N.A4, N.E5, N.C5, N.B4, N.A4,
      N.F4, N.C5, N.A4, N.F5, N.E5, N.C5, N.G5, N.E5,
      N.D5, N.G4, N.B4, N.D5, N.G5, null, N.C5, null,
    ],
    bassNotes: [
      N.C3, N.C4, N.C3, N.C4, N.C3, N.C4, N.G3, N.C4,
      N.A3, N.A4, N.A3, N.A4, N.A3, N.A4, N.E3, N.A3,
      N.F3, N.F4, N.F3, N.F4, N.C3, N.C4, N.C3, N.C4,
      N.G3, N.G4, N.G3, N.G4, N.G3, N.D3, N.C3, null,
    ],
  },
};

class ArcadeAudio {
  private ctx: AudioContext | null = null;
  private _muted = false;
  private radioTimer: number | null = null;
  private radioStep = 0;
  private currentStation = 'radio-off';

  public get muted(): boolean {
    return this._muted;
  }

  public set muted(val: boolean) {
    this._muted = val;
    if (val) {
      this.stopRadio();
    }
  }

  private getContext(): AudioContext | null {
    if (this._muted) return null;
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
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFreq),
        now + duration
      );
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainValue, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public startRadio(stationId: string) {
    this.stopRadio();
    this.currentStation = stationId;
    if (this._muted || stationId === 'radio-off') return;
    const track = RADIO_TRACKS[stationId];
    if (!track) return;

    this.radioStep = 0;
    const stepMs = (60 / track.bpm / 2) * 1000; // eighth notes

    const tick = () => {
      if (this._muted || this.currentStation !== stationId) {
        this.stopRadio();
        return;
      }
      const idx = this.radioStep % track.leadNotes.length;
      const lead = track.leadNotes[idx];
      const bass = track.bassNotes[idx];
      const noteDur = (stepMs / 1000) * 0.85;

      if (lead) {
        const vol = track.leadType === 'sawtooth' || track.leadType === 'square' ? 0.042 : 0.068;
        this.playTone(lead, noteDur, track.leadType, vol, 0);
      }
      if (bass) {
        const bVol = track.bassType === 'sawtooth' || track.bassType === 'square' ? 0.032 : 0.055;
        this.playTone(bass, noteDur * 0.9, track.bassType, bVol, 0);
      }
      this.radioStep += 1;
    };

    tick();
    this.radioTimer = window.setInterval(tick, stepMs);
  }

  public stopRadio() {
    if (this.radioTimer !== null) {
      window.clearInterval(this.radioTimer);
      this.radioTimer = null;
    }
    this.currentStation = 'radio-off';
  }

  public getCurrentStation(): string {
    return this.currentStation;
  }

  public playCountdown(isGo: boolean) {
    if (isGo) {
      this.playTone(880, 0.28, 'sawtooth', 0.14, 0, 1175);
      this.playTone(587, 0.25, 'triangle', 0.14, 0.05);
    } else {
      this.playTone(440, 0.16, 'triangle', 0.16);
    }
  }

  public playCorrect(streak: number, soundId = 'sound-classic') {
    const pitchBoost = Math.pow(1.05, Math.min(streak, 8));

    if (soundId === 'sound-vroom') {
      // Punchy twin-turbo racecar rev!
      this.playTone(110 * pitchBoost, 0.14, 'sawtooth', 0.13, 0, 290 * pitchBoost);
      this.playTone(220 * pitchBoost, 0.18, 'sawtooth', 0.09, 0.07, 460 * pitchBoost);
      this.playTone(660 * pitchBoost, 0.12, 'triangle', 0.12, 0.08);
    } else if (soundId === 'sound-horn') {
      // Playful bouncy double-honk!
      this.playTone(392 * pitchBoost, 0.09, 'square', 0.1, 0, 440 * pitchBoost);
      this.playTone(493.88 * pitchBoost, 0.14, 'square', 0.1, 0.1, 523.25 * pitchBoost);
    } else if (soundId === 'sound-laser') {
      // Sci-fi space laser zoom!
      this.playTone(1200 * pitchBoost, 0.16, 'sine', 0.14, 0, 340);
      this.playTone(760 * pitchBoost, 0.14, 'triangle', 0.12, 0.06, 1480 * pitchBoost);
    } else if (soundId === 'sound-retro') {
      // 8-bit classic power-up arpeggio!
      this.playTone(523.25 * pitchBoost, 0.06, 'square', 0.09, 0);
      this.playTone(659.25 * pitchBoost, 0.06, 'square', 0.09, 0.055);
      this.playTone(783.99 * pitchBoost, 0.08, 'square', 0.09, 0.11);
      this.playTone(1046.5 * pitchBoost, 0.11, 'square', 0.09, 0.165);
    } else {
      // Classic arcade chime + soft rev
      const base = 523.25 * pitchBoost;
      this.playTone(base, 0.11, 'triangle', 0.16, 0);
      this.playTone(base * 1.25, 0.16, 'sine', 0.15, 0.06);
      this.playTone(130, 0.12, 'sawtooth', 0.05, 0, 220);
    }
  }

  public playWrong(soundId = 'sound-classic') {
    if (soundId === 'sound-horn') {
      this.playTone(310, 0.18, 'square', 0.11, 0, 150);
      this.playTone(180, 0.24, 'square', 0.09, 0.11, 95);
    } else if (soundId === 'sound-laser') {
      this.playTone(420, 0.24, 'sawtooth', 0.11, 0, 85);
    } else if (soundId === 'sound-retro') {
      this.playTone(220, 0.1, 'square', 0.1, 0);
      this.playTone(165, 0.16, 'square', 0.1, 0.09);
    } else {
      this.playTone(260, 0.16, 'sawtooth', 0.13, 0, 140);
      this.playTone(190, 0.22, 'square', 0.08, 0.09, 110);
    }
  }

  public previewSound(soundId: string) {
    this.playCorrect(2, soundId);
  }

  public playTurbo(team: TeamId) {
    if (team === 'doggy') {
      this.playTone(320, 0.09, 'sawtooth', 0.16, 0, 560);
      this.playTone(380, 0.11, 'sawtooth', 0.16, 0.1, 680);
      this.playTone(523, 0.32, 'triangle', 0.15, 0.18, 1046);
    } else {
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

  public playVictory(celebrationId = 'cel-confetti') {
    const melody =
      celebrationId === 'cel-champion'
        ? [
            { f: 523.25, d: 0.11, t: 0 },
            { f: 659.25, d: 0.11, t: 0.1 },
            { f: 783.99, d: 0.11, t: 0.2 },
            { f: 1046.5, d: 0.22, t: 0.3 },
            { f: 783.99, d: 0.1, t: 0.5 },
            { f: 1046.5, d: 0.12, t: 0.6 },
            { f: 1318.5, d: 0.45, t: 0.72 },
          ]
        : [
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
