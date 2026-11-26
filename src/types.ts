export type TeamId = 'doggy' | 'slothy';

export type GameMode = 'solo' | 'multiplayer' | 'coop-boss';

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

export type PowerUpType = 'shield' | 'mushroom' | 'coin-burst';

export interface PlayerMathConfig {
  operation: Operation;
  difficulty: Difficulty;
  timesTableFocus: number | null;
  inputMode: InputMode;
  smartPractice: boolean;
}

export interface RaceConfig {
  format: RaceFormat;
  lapPreset: LapPreset;
  sprintSeconds: number;
  sharedMath: boolean;
  fairRaceNoPerks: boolean;
  powerUpsEnabled: boolean;
  grandPrixMode?: boolean;
  trackId: string;
  hostMath: PlayerMathConfig;
  guestMath: PlayerMathConfig;
  cpuDifficulty: CpuDifficulty;
}

export interface GrandPrixState {
  active: boolean;
  cupName: string;
  tracks: string[]; // 3 track IDs
  raceIndex: number; // 0, 1, 2
  myPoints: number;
  opponentPoints: number;
}

export interface MathProblem {
  id: string;
  a: number;
  b: number;
  operation: SingleOperation;
  symbol: '+' | '-' | '×' | '÷';
  answer: number;
  choices: number[];
  isSmartReview?: boolean;
}

export interface MissedQuestion {
  prompt: string;
  factKey: string;
  correctAnswer: number;
  givenAnswer: number;
  operation: SingleOperation;
}

export type ShopCategory =
  | 'car'
  | 'gear'
  | 'accessory'
  | 'trail'
  | 'track'
  | 'sound'
  | 'radio'
  | 'celebration';

export interface ShopPerks {
  speedBonus?: number;
  turboBonus?: number;
  spinoutReduction?: number;
  turboStreakReq?: number;
  coinMultiplier?: number;
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
  trackId: string;
  soundId: string;
  radioId: string;
  celebrationId: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
  kind: 'solve' | 'streak' | 'win' | 'accuracy' | 'mult-div' | 'boss';
}

export interface DailyQuestState {
  dateKey: string;
  quests: DailyQuest[];
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
  bossWins: number;
  grandPrixWins: number;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  bestQpm: number;
  longestStreak: number;
  perfectRaces: number;
  byOperation: Record<SingleOperation, OperationStat>;
}

export interface RaceRecord {
  id: string;
  date: string;
  mode: GameMode;
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
  racerName: string;
  coins: number;
  xp: number;
  practiceStreak: number;
  lastPracticeDate: string | null;
  racesSinceGift: number;
  mysteryGiftsReady: number;
  unlockedIds: string[];
  equipped: EquippedLoadout;
  stats: CareerStats;
  recentRaces: RaceRecord[];
  missedFactCounts: Record<string, number>;
  dailyQuests: DailyQuestState;
  badges: string[];
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
  progress: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  bestStreak: number;
  turboUntil: number;
  spinoutUntil: number;
  shieldActive?: boolean;
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
  powerUpBonus: number;
  perkMultiplierBonus: number;
  total: number;
}

export interface RaceSummary {
  myTeam: TeamId;
  opponentTeam: TeamId;
  mode: GameMode;
  config: RaceConfig;
  myMathConfig: PlayerMathConfig;
  result: 'win' | 'loss' | 'tie';
  myState: RacerLiveState;
  opponentState: RacerLiveState;
  bossProgress?: number;
  durationMs: number;
  qpm: number;
  accuracy: number;
  missedQuestions: MissedQuestion[];
  masteredFactKeys: string[];
  coins: CoinBreakdown;
  perOperationCounts: Record<SingleOperation, OperationStat>;
  newlyUnlockedBadges?: string[];
  xpEarned?: number;
  leveledUpTo?: number | null;
  levelUpCoins?: number;
  mysteryGiftEarned?: boolean;
  grandPrix?: GrandPrixState | null;
  grandPrixBonusCoins?: number;
}

export type PeerMessage =
  | {
      type: 'hello';
      team: TeamId;
      racerName: string;
      loadout: EquippedLoadout;
    }
  | {
      type: 'lobby-state';
      mode: GameMode;
      config: RaceConfig;
      hostTeam: TeamId;
      hostName: string;
      hostLoadout: EquippedLoadout;
      guestTeam: TeamId;
      guestName: string;
      guestLoadout: EquippedLoadout;
    }
  | {
      type: 'guest-update';
      guestMath: PlayerMathConfig;
      guestName: string;
      loadout: EquippedLoadout;
    }
  | {
      type: 'start-race';
      mode: GameMode;
      startAt: number;
      config: RaceConfig;
      grandPrix?: GrandPrixState | null;
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
      shieldActive?: boolean;
      finished: boolean;
      finishTimeMs: number | null;
    }
  | {
      type: 'emote';
      emote: string;
    }
  | {
      type: 'rematch-request';
    }
  | {
      type: 'rematch-accept';
    };
