import confetti from 'canvas-confetti';
import { TeamId } from '../types';

export interface CelebrationInfo {
  banner: string;
  heroClass: string;
}

export function getCelebrationInfo(celebrationId: string): CelebrationInfo {
  switch (celebrationId) {
    case 'cel-fireworks':
      return {
        banner: '🎆 FIREWORKS FINALE!',
        heroClass: 'podium-cel--fireworks',
      };
    case 'cel-stars':
      return {
        banner: '⭐ SUPERSTAR SHOWER!',
        heroClass: 'podium-cel--stars',
      };
    case 'cel-rainbow':
      return {
        banner: '🌈 RAINBOW PARTY CANNONS!',
        heroClass: 'podium-cel--rainbow',
      };
    case 'cel-champion':
      return {
        banner: '👑 ROYAL TROPHY BLAST!',
        heroClass: 'podium-cel--champion',
      };
    case 'cel-bubbles':
      return {
        banner: '🫧 BUBBLE POP PARTY!',
        heroClass: 'podium-cel--bubbles',
      };
    case 'cel-hearts':
      return {
        banner: '💖 HEART EXPLOSION!',
        heroClass: 'podium-cel--hearts',
      };
    case 'cel-lightning':
      return {
        banner: '⚡ ELECTRIC THUNDER SHOW!',
        heroClass: 'podium-cel--lightning',
      };
    case 'cel-unicorn':
      return {
        banner: '🦄 UNICORN MAGIC FINALE!',
        heroClass: 'podium-cel--unicorn',
      };
    default:
      return {
        banner: '🎉 CHECKERED FLAG!',
        heroClass: 'podium-cel--confetti',
      };
  }
}

/**
 * Triggers the equipped Victory Celebration Animation and returns a cleanup function
 * that cancels any scheduled bursts when leaving the screen.
 */
export function runCelebrationAnimation(
  celebrationId: string,
  winnerTeam: TeamId
): () => void {
  const timers: number[] = [];
  const teamColors =
    winnerTeam === 'doggy'
      ? ['#e11d48', '#facc15', '#fb923c', '#ffffff']
      : ['#0d9488', '#34d399', '#38bdf8', '#facc15'];

  const rainbow = [
    '#ef4444',
    '#f97316',
    '#facc15',
    '#22c55e',
    '#3b82f6',
    '#a855f7',
    '#ec4899',
  ];

  if (celebrationId === 'cel-fireworks') {
    const spots = [
      { x: 0.25, y: 0.35, d: 0 },
      { x: 0.75, y: 0.3, d: 350 },
      { x: 0.5, y: 0.25, d: 700 },
      { x: 0.3, y: 0.45, d: 1100 },
      { x: 0.7, y: 0.42, d: 1450 },
    ];
    for (const s of spots) {
      timers.push(
        window.setTimeout(() => {
          confetti({
            particleCount: 65,
            startVelocity: 32,
            spread: 360,
            ticks: 70,
            origin: { x: s.x, y: s.y },
            colors: rainbow,
          });
        }, s.d)
      );
    }
  } else if (celebrationId === 'cel-stars') {
    for (let i = 0; i < 4; i++) {
      timers.push(
        window.setTimeout(() => {
          confetti({
            particleCount: 40,
            spread: 100,
            scalar: 1.35,
            shapes: ['star'],
            colors: ['#facc15', '#fde047', '#fef08a', '#f59e0b', '#ffffff'],
            origin: { x: 0.2 + i * 0.2, y: 0.2 },
          });
        }, i * 320)
      );
    }
  } else if (celebrationId === 'cel-rainbow') {
    for (let i = 0; i < 5; i++) {
      timers.push(
        window.setTimeout(() => {
          confetti({
            particleCount: 38,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.65 },
            colors: rainbow,
          });
          confetti({
            particleCount: 38,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.65 },
            colors: rainbow,
          });
        }, i * 340)
      );
    }
  } else if (celebrationId === 'cel-champion') {
    // Ultimate golden coin + star + rainbow grand finale!
    confetti({
      particleCount: 110,
      spread: 110,
      scalar: 1.3,
      shapes: ['circle', 'star'],
      colors: ['#facc15', '#eab308', '#fef08a', '#ffffff', ...teamColors],
      origin: { y: 0.5 },
    });
    for (let i = 0; i < 4; i++) {
      timers.push(
        window.setTimeout(() => {
          confetti({
            particleCount: 45,
            angle: i % 2 === 0 ? 55 : 125,
            spread: 70,
            shapes: ['star', 'circle'],
            colors: ['#facc15', '#f59e0b', '#ffffff', ...rainbow],
            origin: { x: i % 2 === 0 ? 0.05 : 0.95, y: 0.6 },
          });
        }, 300 + i * 360)
      );
    }
  } else if (celebrationId === 'cel-bubbles') {
    // Soft rising aqua, pink, and white circular confetti bubbles!
    const bubbleColors = [
      '#67e8f9',
      '#a5f3fc',
      '#38bdf8',
      '#f9a8d4',
      '#fbcfe8',
      '#ffffff',
    ];
    for (let i = 0; i < 6; i++) {
      timers.push(
        window.setTimeout(() => {
          confetti({
            particleCount: 28,
            angle: 90,
            spread: 75,
            startVelocity: 26,
            gravity: 0.45,
            ticks: 110,
            scalar: 1.4,
            drift: i % 2 === 0 ? 0.35 : -0.35,
            shapes: ['circle'],
            colors: bubbleColors,
            origin: { x: 0.15 + i * 0.14, y: 0.92 },
          });
        }, i * 260)
      );
    }
  } else if (celebrationId === 'cel-hearts') {
    // Cascading pink, magenta, red, and gold celebratory bursts!
    const heartColors = [
      '#ec4899',
      '#f43f5e',
      '#e11d48',
      '#f472b6',
      '#fda4af',
      '#facc15',
    ];
    const bursts = [
      { x: 0.5, y: 0.4, d: 0, count: 75 },
      { x: 0.25, y: 0.32, d: 260, count: 48 },
      { x: 0.75, y: 0.32, d: 520, count: 48 },
      { x: 0.38, y: 0.48, d: 820, count: 50 },
      { x: 0.62, y: 0.48, d: 1080, count: 50 },
    ];
    for (const b of bursts) {
      timers.push(
        window.setTimeout(() => {
          confetti({
            particleCount: b.count,
            spread: 115,
            startVelocity: 34,
            scalar: 1.25,
            shapes: ['circle', 'star'],
            colors: heartColors,
            origin: { x: b.x, y: b.y },
          });
        }, b.d)
      );
    }
  } else if (celebrationId === 'cel-lightning') {
    // Rapid bright yellow, cyan, and white high-velocity bursts!
    const thunderColors = ['#facc15', '#fde047', '#22d3ee', '#38bdf8', '#ffffff'];
    for (let i = 0; i < 6; i++) {
      timers.push(
        window.setTimeout(() => {
          const fromLeft = i % 2 === 0;
          confetti({
            particleCount: 44,
            angle: fromLeft ? 52 : 128,
            spread: 48,
            startVelocity: 58,
            ticks: 65,
            scalar: 1.15,
            shapes: ['star', 'square'],
            colors: thunderColors,
            origin: { x: fromLeft ? 0.05 : 0.95, y: 0.35 + (i % 3) * 0.14 },
          });
        }, i * 190)
      );
    }
    timers.push(
      window.setTimeout(() => {
        confetti({
          particleCount: 85,
          spread: 140,
          startVelocity: 52,
          shapes: ['star', 'square'],
          colors: thunderColors,
          origin: { x: 0.5, y: 0.35 },
        });
      }, 420)
    );
  } else if (celebrationId === 'cel-unicorn') {
    // Dazzling pastel rainbow + golden star spirals from both sides and center!
    const unicornColors = [
      '#f9a8d4',
      '#c4b5fd',
      '#93c5fd',
      '#6ee7b7',
      '#fde047',
      '#facc15',
      '#ffffff',
    ];
    confetti({
      particleCount: 90,
      spread: 120,
      startVelocity: 38,
      scalar: 1.35,
      shapes: ['star', 'circle'],
      colors: unicornColors,
      origin: { x: 0.5, y: 0.45 },
    });
    for (let i = 0; i < 5; i++) {
      timers.push(
        window.setTimeout(() => {
          confetti({
            particleCount: 36,
            angle: 48 + i * 8,
            spread: 55,
            startVelocity: 44,
            scalar: 1.25,
            shapes: ['star', 'circle'],
            colors: unicornColors,
            origin: { x: 0.02, y: 0.72 - i * 0.07 },
          });
          confetti({
            particleCount: 36,
            angle: 132 - i * 8,
            spread: 55,
            startVelocity: 44,
            scalar: 1.25,
            shapes: ['star', 'circle'],
            colors: unicornColors,
            origin: { x: 0.98, y: 0.72 - i * 0.07 },
          });
        }, 200 + i * 280)
      );
    }
  } else {
    confetti({
      particleCount: 95,
      spread: 80,
      origin: { y: 0.55 },
      colors: teamColors,
    });
  }

  return () => {
    for (const id of timers) {
      window.clearTimeout(id);
    }
  };
}
