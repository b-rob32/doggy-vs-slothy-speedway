import { RaceSummary, SaveData, TeamId } from '../types';

export const XP_PER_LEVEL = 100;

export const LEVEL_TITLES: string[] = [
  'Rookie Racer',
  'Speedy Sprout',
  'Math Zoomer',
  'Turbo Kid',
  'Track Star',
  'Zooming Ace',
  'Pit Boss',
  'Nitro Wiz',
  'Curve Crusher',
  'Grand Prix Ace',
  'Lightning Driver',
  'Rocket Genius',
  'Drift Champion',
  'Cosmic Cruiser',
  'Hyper Solver',
  'Trophy Hunter',
  'Speedway Superstar',
  'Galaxy Racer',
  'Ultra Champion',
  'Math Legend!',
];

export interface LevelInfo {
  level: number;
  title: string;
  xpInLevel: number;
  xpForNext: number;
  progressPct: number;
}

export function getLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const xpInLevel = safeXp % XP_PER_LEVEL;
  const xpForNext = XP_PER_LEVEL;
  const progressPct = Math.round((xpInLevel / xpForNext) * 100);
  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
  const title = LEVEL_TITLES[titleIndex];

  return {
    level,
    title,
    xpInLevel,
    xpForNext,
    progressPct,
  };
}

export function computeRaceXp(summary: RaceSummary): number {
  const baseXp = 25;
  const correctXp = summary.myState.correctCount * 2;
  const resultXp =
    summary.result === 'win' ? 20 : summary.result === 'tie' ? 10 : 5;
  const isGrandPrixFinalWin = Boolean(
    summary.grandPrix &&
      summary.grandPrix.raceIndex === 2 &&
      summary.grandPrix.myPoints >= summary.grandPrix.opponentPoints
  );
  const grandPrixXp = isGrandPrixFinalWin ? 15 : 0;

  return baseXp + correctXp + resultXp + grandPrixXp;
}

const MYSTERY_GIFT_PRIZES = [35, 45, 55, 70, 90] as const;

function getGiftMessage(coinsWon: number): string {
  if (coinsWon >= 90) {
    return `MEGA JACKPOT! +${coinsWon} Speed Coins!`;
  }
  if (coinsWon >= 70) {
    return `Surprise Jackpot! +${coinsWon} Speed Coins!`;
  }
  if (coinsWon >= 55) {
    return `Turbo Treasure! +${coinsWon} Speed Coins!`;
  }
  if (coinsWon >= 45) {
    return `Speedway Bonus! +${coinsWon} Speed Coins!`;
  }
  return `Shiny Coin Stash! +${coinsWon} Speed Coins!`;
}

export function openMysteryGift(
  save: SaveData,
  team: TeamId
): { nextSave: SaveData; coinsWon: number; message: string } {
  const profile = save.profiles[team];
  if (profile.mysteryGiftsReady <= 0) {
    return {
      nextSave: save,
      coinsWon: 0,
      message: 'No Mystery Gift Boxes ready yet — finish 3 races to earn one!',
    };
  }

  const prizeIndex = Math.floor(Math.random() * MYSTERY_GIFT_PRIZES.length);
  const coinsWon = MYSTERY_GIFT_PRIZES[prizeIndex];
  const message = getGiftMessage(coinsWon);

  const nextSave: SaveData = {
    ...save,
    profiles: {
      ...save.profiles,
      [team]: {
        ...profile,
        coins: profile.coins + coinsWon,
        mysteryGiftsReady: Math.max(0, profile.mysteryGiftsReady - 1),
      },
    },
  };

  return {
    nextSave,
    coinsWon,
    message,
  };
}
