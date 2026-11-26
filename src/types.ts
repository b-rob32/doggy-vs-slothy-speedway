export type TeamId = 'doggy' | 'slothy';

export type Operation =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'mixed';

export type SingleOperation = Exclude<Operation, 'mixed'>;

export type Difficulty = 'easy' | 'medium' | 'hard';

export type InputMode = 'multiple-choice' | 'type-answer';

export type RaceFormat = 'laps' | 'sprint';

export type LapPreset = 'quick' | 'standard' | 'long';

export type CpuDifficulty = 'easy' | 'medium' | 'fast';

export interface PlayerMathConfig {
  operation: Operation;
  difficulty: Difficulty;
  timesTableFocus: number | null; // 2..12 when operation === 'multiplication'
  inputMode: InputMode;
}

export interface RaceConfig {
  format: RaceFormat;
  lapPreset: LapPreset;
  sprintSeconds: number;
  sharedMath: boolean;
  fairRaceNoPerks: boolean;
  hostMath: PlayerMathConfig;
  guestMath: PlayerMathConfig;
  cpuDifficulty: CpuDifficulty;
}

export interface MathProblem {
  id: string;
  a: number;
  b: number;
  operation: SingleOperation;
  symbol: '+' | '-' | '×' | '÷';
  answer: number;
  choices: number[];
}

export interface MissedQuestion {
  prompt: string;
  correctAnswer: number;
  givenAnswer: number;
  operation: SingleOperation;
}

export type ShopCategory = 'car' | 'gear' | 'accessory' | 'trail';

export interface ShopPerks {
  speedBonus?: number; // e.g., 0.08 = +8% progress per correct answer
  turboBonus?: number; // e.g., 0.25 = +25% extra turbo boost distance
  spinoutReduction?: number; // e.g., 0.35 = 35% shorter spin-out recovery
  turboStreakReq?: number; // e.g., 2 instead of default 3
  coinMultiplier?: number; // e.g., 0.25 = +25% coins earned
}

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  description: string;
  perkLabel: string;
  price: number;
  perks: ShopPerks;
  accentColor?: string;
}

export interface EquippedLoadout {
  carId: string;
  gearId: string;
  accessoryId: string;
  trailId: string;
}

export interface OperationStat {
  correct: number;
  total: number;
}

export interface CareerStats {
  totalRaces: number;
  wins: number;
  losses: number;
  ties: number;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  bestQpm: number;
  longestStreak: number;
  byOperation: Record<SingleOperation, OperationStat>;
}

export interface RaceRecord {
  id: string;
  date: string;
  mode: 'solo' | 'multiplayer';
  format: RaceFormat;
  operation: Operation;
  difficulty: Difficulty;
  result: 'win' | 'loss' | 'tie';
  correctCount: number;
  wrongCount: number;
  qpm: number;
  bestStreak: number;
  coinsEarned: number;
  opponentProgress: number;
  myProgress: number;
}

export interface TeamProfile {
  team: TeamId;
  coins: number;
  unlockedIds: string[];
  equipped: EquippedLoadout;
  stats: CareerStats;
  recentRaces: RaceRecord[];
}

export interface HeadToHeadRecord {
  doggyWins: number;
  slothyWins: number;
  ties: number;
}

export interface SaveData {
  version: number;
  profiles: Record<TeamId, TeamProfile>;
  headToHead: HeadToHeadRecord;
  soundMuted: boolean;
}

export interface RacerLiveState {
  team: TeamId;
  progress: number; // 0 .. totalLaps (e.g., 0 .. 3.0) for lap race, or unbounded laps for sprint
  correctCount: number;
  wrongCount: number;
  streak: number;
  bestStreak: number;
  turboUntil: number; // timestamp ms
  spinoutUntil: number; // timestamp ms
  finished: boolean;
  finishTimeMs: number | null;
  loadout: EquippedLoadout;
}

export interface CoinBreakdown {
  baseCompletion: number;
  correctBonus: number;
  streakBonus: number;
  accuracyBonus: number;
  podiumBonus: number;
  perkMultiplierBonus: number;
  total: number;
}

export interface RaceSummary {
  myTeam: TeamId;
  opponentTeam: TeamId;
  mode: 'solo' | 'multiplayer';
  config: RaceConfig;
  myMathConfig: PlayerMathConfig;
  result: 'win' | 'loss' | 'tie';
  myState: RacerLiveState;
  opponentState: RacerLiveState;
  durationMs: number;
  qpm: number;
  accuracy: number;
  missedQuestions: MissedQuestion[];
  coins: CoinBreakdown;
  perOperationCounts: Record<SingleOperation, OperationStat>;
}

// PeerJS multiplayer protocol messages
export type PeerMessage =
  | {
      type: 'hello';
      team: TeamId;
      loadout: EquippedLoadout;
    }
  | {
      type: 'lobby-state';
      config: RaceConfig;
      hostTeam: TeamId;
      hostLoadout: EquippedLoadout;
      guestTeam: TeamId;
      guestLoadout: EquippedLoadout;
    }
  | {
      type: 'guest-update';
      guestMath: PlayerMathConfig;
      loadout: EquippedLoadout;
    }
  | {
      type: 'start-race';
      startAt: number; // synchronized countdown start timestamp (relative offset)
      config: RaceConfig;
    }
  | {
      type: 'progress';
      progress: number;
      correctCount: number;
      wrongCount: number;
      streak: number;
      bestStreak: number;
      turboActive: boolean;
      spinoutActive: boolean;
      finished: boolean;
      finishTimeMs: number | null;
    }
  | {
      type: 'rematch-request';
    }
  | {
      type: 'rematch-accept';
    };
