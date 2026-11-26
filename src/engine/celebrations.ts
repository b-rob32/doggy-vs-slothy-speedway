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
