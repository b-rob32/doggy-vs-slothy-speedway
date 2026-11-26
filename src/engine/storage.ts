import {
  CareerStats,
  CoinBreakdown,
  EquippedLoadout,
  OperationStat,
  RaceSummary,
  SaveData,
  SingleOperation,
  TeamId,
  TeamProfile,
} from '../types';
import {
  DEFAULT_LOADOUT,
  DEFAULT_UNLOCKED_IDS,
  getEffectivePerks,
} from '../data/shop';
import {
  createDailyQuests,
  ensureFreshDailyQuests,
  evaluateBadges,
  getTodayKey,
  updateDailyQuestsAfterRace,
} from './quests';

const STORAGE_KEY = 'doggy-vs-slothy-speedway-save-v1';

function emptyStats(): CareerStats {
  return {
    totalRaces: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    bossWins: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    totalWrong: 0,
    bestQpm: 0,
    longestStreak: 0,
    perfectRaces: 0,
    byOperation: {
      addition: { correct: 0, total: 0 },
      subtraction: { correct: 0, total: 0 },
      multiplication: { correct: 0, total: 0 },
      division: { correct: 0, total: 0 },
    },
  };
}

function createDefaultProfile(team: TeamId): TeamProfile {
  return {
    team,
    racerName: '',
    coins: 60, // friendly starter allowance!
    unlockedIds: [...DEFAULT_UNLOCKED_IDS],
    equipped: { ...DEFAULT_LOADOUT },
    stats: emptyStats(),
    recentRaces: [],
    missedFactCounts: {},
    dailyQuests: createDailyQuests(getTodayKey()),
    badges: [],
  };
}

export function createDefaultSave(): SaveData {
  return {
    version: 1,
    profiles: {
      doggy: createDefaultProfile('doggy'),
      slothy: createDefaultProfile('slothy'),
    },
    headToHead: {
      doggyWins: 0,
      slothyWins: 0,
      ties: 0,
    },
    soundMuted: false,
  };
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const defaults = createDefaultSave();
    return {
      version: 1,
      soundMuted: parsed.soundMuted ?? false,
      headToHead: {
        ...defaults.headToHead,
        ...(parsed.headToHead ?? {}),
      },
      profiles: {
        doggy: mergeProfile(defaults.profiles.doggy, parsed.profiles?.doggy),
        slothy: mergeProfile(defaults.profiles.slothy, parsed.profiles?.slothy),
      },
    };
  } catch {
    return createDefaultSave();
  }
}

function mergeProfile(
  fallback: TeamProfile,
  loaded?: Partial<TeamProfile>
): TeamProfile {
  if (!loaded) return fallback;
  return {
    team: fallback.team,
    racerName:
      typeof loaded.racerName === 'string'
        ? loaded.racerName
        : fallback.racerName,
    coins: typeof loaded.coins === 'number' ? loaded.coins : fallback.coins,
    unlockedIds: Array.isArray(loaded.unlockedIds)
      ? Array.from(new Set([...DEFAULT_UNLOCKED_IDS, ...loaded.unlockedIds]))
      : fallback.unlockedIds,
    equipped: {
      ...DEFAULT_LOADOUT,
      ...(loaded.equipped ?? {}),
    },
    stats: {
      ...emptyStats(),
      ...(loaded.stats ?? {}),
      byOperation: {
        ...emptyStats().byOperation,
        ...(loaded.stats?.byOperation ?? {}),
      },
    },
    recentRaces: Array.isArray(loaded.recentRaces) ? loaded.recentRaces : [],
    missedFactCounts:
      loaded.missedFactCounts && typeof loaded.missedFactCounts === 'object'
        ? { ...loaded.missedFactCounts }
        : {},
    dailyQuests: ensureFreshDailyQuests(loaded.dailyQuests),
    badges: Array.isArray(loaded.badges)
      ? Array.from(new Set(loaded.badges))
      : [],
  };
}

export function persistSaveData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function calculateCoins(
  result: 'win' | 'loss' | 'tie',
  correctCount: number,
  wrongCount: number,
  bestStreak: number,
  loadout: EquippedLoadout,
  fairRaceNoPerks: boolean,
  powerUpBonus = 0
): CoinBreakdown {
  const baseCompletion = 20;
  const correctBonus = correctCount * 3;
  const streakBonus = bestStreak >= 3 ? bestStreak * 4 : 0;
  const totalAttempts = correctCount + wrongCount;
  const accuracy = totalAttempts > 0 ? correctCount / totalAttempts : 0;
  const accuracyBonus = accuracy >= 0.9 ? 20 : accuracy >= 0.75 ? 10 : 0;
  const podiumBonus = result === 'win' ? 35 : result === 'tie' ? 20 : 10;

  const subtotal =
    baseCompletion +
    correctBonus +
    streakBonus +
    accuracyBonus +
    podiumBonus +
    powerUpBonus;

  const perks = getEffectivePerks(loadout, fairRaceNoPerks);
  const perkMultiplierBonus = Math.round(subtotal * perks.coinMultiplier);

  return {
    baseCompletion,
    correctBonus,
    streakBonus,
    accuracyBonus,
    podiumBonus,
    powerUpBonus,
    perkMultiplierBonus,
    total: subtotal + perkMultiplierBonus,
  };
}

export function recordRaceInSave(
  save: SaveData,
  summary: RaceSummary
): SaveData {
  const team = summary.myTeam;
  const profile = save.profiles[team];

  const nextByOp: Record<SingleOperation, OperationStat> = {
    addition: {
      correct:
        profile.stats.byOperation.addition.correct +
        summary.perOperationCounts.addition.correct,
      total:
        profile.stats.byOperation.addition.total +
        summary.perOperationCounts.addition.total,
    },
    subtraction: {
      correct:
        profile.stats.byOperation.subtraction.correct +
        summary.perOperationCounts.subtraction.correct,
      total:
        profile.stats.byOperation.subtraction.total +
        summary.perOperationCounts.subtraction.total,
    },
    multiplication: {
      correct:
        profile.stats.byOperation.multiplication.correct +
        summary.perOperationCounts.multiplication.correct,
      total:
        profile.stats.byOperation.multiplication.total +
        summary.perOperationCounts.multiplication.total,
    },
    division: {
      correct:
        profile.stats.byOperation.division.correct +
        summary.perOperationCounts.division.correct,
      total:
        profile.stats.byOperation.division.total +
        summary.perOperationCounts.division.total,
    },
  };

  const nextMissedFacts: Record<string, number> = {
    ...(profile.missedFactCounts ?? {}),
  };
  for (const missed of summary.missedQuestions) {
    if (missed.factKey) {
      nextMissedFacts[missed.factKey] =
        (nextMissedFacts[missed.factKey] ?? 0) + 1;
    }
  }
  for (const key of summary.masteredFactKeys) {
    if (nextMissedFacts[key]) {
      if (nextMissedFacts[key] <= 1) {
        delete nextMissedFacts[key];
      } else {
        nextMissedFacts[key] -= 1;
      }
    }
  }

  const isBossWin =
    summary.mode === 'coop-boss' && summary.result === 'win';
  const isPerfectRace =
    summary.accuracy === 100 && summary.myState.correctCount >= 8;

  const updatedProfile: TeamProfile = {
    ...profile,
    coins: profile.coins + summary.coins.total,
    stats: {
      totalRaces: profile.stats.totalRaces + 1,
      wins: profile.stats.wins + (summary.result === 'win' ? 1 : 0),
      losses: profile.stats.losses + (summary.result === 'loss' ? 1 : 0),
      ties: profile.stats.ties + (summary.result === 'tie' ? 1 : 0),
      bossWins: profile.stats.bossWins + (isBossWin ? 1 : 0),
      totalQuestions:
        profile.stats.totalQuestions +
        summary.myState.correctCount +
        summary.myState.wrongCount,
      totalCorrect: profile.stats.totalCorrect + summary.myState.correctCount,
      totalWrong: profile.stats.totalWrong + summary.myState.wrongCount,
      bestQpm: Math.max(profile.stats.bestQpm, summary.qpm),
      longestStreak: Math.max(
        profile.stats.longestStreak,
        summary.myState.bestStreak
      ),
      perfectRaces: profile.stats.perfectRaces + (isPerfectRace ? 1 : 0),
      byOperation: nextByOp,
    },
    recentRaces: [
      {
        id: `${Date.now()}`,
        date: new Date().toISOString(),
        mode: summary.mode,
        format: summary.config.format,
        operation: summary.myMathConfig.operation,
        difficulty: summary.myMathConfig.difficulty,
        result: summary.result,
        correctCount: summary.myState.correctCount,
        wrongCount: summary.myState.wrongCount,
        qpm: summary.qpm,
        bestStreak: summary.myState.bestStreak,
        coinsEarned: summary.coins.total,
        myProgress: Number(summary.myState.progress.toFixed(2)),
        opponentProgress: Number(summary.opponentState.progress.toFixed(2)),
      },
      ...profile.recentRaces,
    ].slice(0, 30),
    missedFactCounts: nextMissedFacts,
    dailyQuests: updateDailyQuestsAfterRace(profile.dailyQuests, summary),
  };

  updatedProfile.badges = evaluateBadges(updatedProfile);

  const nextH2H = { ...save.headToHead };
  if (summary.mode !== 'coop-boss') {
    if (summary.result === 'tie') {
      nextH2H.ties += 1;
    } else {
      const winnerTeam =
        summary.result === 'win' ? summary.myTeam : summary.opponentTeam;
      if (winnerTeam === 'doggy') nextH2H.doggyWins += 1;
      else nextH2H.slothyWins += 1;
    }
  }

  return {
    ...save,
    headToHead: nextH2H,
    profiles: {
      ...save.profiles,
      [team]: updatedProfile,
    },
  };
}

export function claimQuestReward(
  save: SaveData,
  team: TeamId,
  questId: string
): SaveData {
  const profile = save.profiles[team];
  const dailyQuests = ensureFreshDailyQuests(profile.dailyQuests);
  let rewardEarned = 0;

  const nextQuests = dailyQuests.quests.map((quest) => {
    if (
      quest.id === questId &&
      !quest.claimed &&
      quest.progress >= quest.target
    ) {
      rewardEarned = quest.reward;
      return { ...quest, claimed: true };
    }
    return quest;
  });

  if (rewardEarned === 0) {
    return save;
  }

  return {
    ...save,
    profiles: {
      ...save.profiles,
      [team]: {
        ...profile,
        coins: profile.coins + rewardEarned,
        dailyQuests: {
          ...dailyQuests,
          quests: nextQuests,
        },
      },
    },
  };
}

export function exportSaveCode(data: SaveData): string {
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
}

export function importSaveCode(code: string): SaveData | null {
  try {
    const json = decodeURIComponent(escape(atob(code.trim())));
    const parsed = JSON.parse(json) as Partial<SaveData>;
    if (!parsed || !parsed.profiles) return null;
    const defaults = createDefaultSave();
    return {
      version: 1,
      soundMuted: parsed.soundMuted ?? false,
      headToHead: {
        ...defaults.headToHead,
        ...(parsed.headToHead ?? {}),
      },
      profiles: {
        doggy: mergeProfile(defaults.profiles.doggy, parsed.profiles.doggy),
        slothy: mergeProfile(defaults.profiles.slothy, parsed.profiles.slothy),
      },
    };
  } catch {
    return null;
  }
}
