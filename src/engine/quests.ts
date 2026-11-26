import {
  DailyQuest,
  DailyQuestState,
  RaceSummary,
  TeamProfile,
} from '../types';
import { DEFAULT_UNLOCKED_IDS, SHOP_ITEMS } from '../data/shop';

export interface TrophyBadge {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const TROPHY_BADGES: TrophyBadge[] = [
  {
    id: 'badge-first-win',
    name: 'First Victory',
    emoji: '🏆',
    description: 'Win 1 race on the speedway!',
  },
  {
    id: 'badge-speed-demon',
    name: 'Speed Demon',
    emoji: '⚡',
    description: 'Hit 20+ questions per minute (QPM) in a race!',
  },
  {
    id: 'badge-perfectionist',
    name: 'Perfectionist',
    emoji: '🎯',
    description: 'Finish a race with 100% accuracy and at least 8 right answers!',
  },
  {
    id: 'badge-unstoppable',
    name: 'Unstoppable',
    emoji: '🔥',
    description: 'Get a 10+ answer streak in a race!',
  },
  {
    id: 'badge-century',
    name: 'Math Century',
    emoji: '💯',
    description: 'Solve 100+ total math questions!',
  },
  {
    id: 'badge-shopaholic',
    name: 'Garage Collector',
    emoji: '🛍️',
    description: 'Unlock 6+ extra garage items beyond the starters!',
  },
  {
    id: 'badge-boss-buster',
    name: 'Boss Buster',
    emoji: '🤖',
    description: 'Defeat Mega-Bot 3000 in a Co-Op Boss Race!',
  },
  {
    id: 'badge-dj',
    name: 'Speedway DJ',
    emoji: '📻',
    description: 'Unlock 3+ car radio music stations!',
  },
];

interface QuestTemplate {
  kind: DailyQuest['kind'];
  title: string;
  target: number;
  reward: number;
}

const QUEST_POOL: QuestTemplate[] = [
  {
    kind: 'solve',
    title: 'Solve 15 math problems',
    target: 15,
    reward: 35,
  },
  {
    kind: 'streak',
    title: 'Get a 4-answer streak',
    target: 4,
    reward: 30,
  },
  {
    kind: 'win',
    title: 'Win 1 speedway race',
    target: 1,
    reward: 40,
  },
  {
    kind: 'accuracy',
    title: 'Finish a race with 85%+ accuracy',
    target: 1,
    reward: 45,
  },
  {
    kind: 'mult-div',
    title: 'Solve 10 × or ÷ problems',
    target: 10,
    reward: 35,
  },
  {
    kind: 'boss',
    title: 'Play a Co-Op Boss Race',
    target: 1,
    reward: 45,
  },
];

export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDailyQuests(dateKey: string): DailyQuestState {
  const rng = createSeededRng(hashString(dateKey));
  const pool = [...QUEST_POOL];

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const quests: DailyQuest[] = pool.slice(0, 3).map((tpl) => ({
    id: `${dateKey}-${tpl.kind}`,
    title: tpl.title,
    target: tpl.target,
    progress: 0,
    reward: tpl.reward,
    claimed: false,
    kind: tpl.kind,
  }));

  return {
    dateKey,
    quests,
  };
}

export function ensureFreshDailyQuests(
  state?: DailyQuestState
): DailyQuestState {
  const today = getTodayKey();
  if (
    !state ||
    state.dateKey !== today ||
    !Array.isArray(state.quests) ||
    state.quests.length === 0
  ) {
    return createDailyQuests(today);
  }
  return state;
}

export function updateDailyQuestsAfterRace(
  state: DailyQuestState,
  summary: RaceSummary
): DailyQuestState {
  const fresh = ensureFreshDailyQuests(state);
  const multDivCorrect =
    summary.perOperationCounts.multiplication.correct +
    summary.perOperationCounts.division.correct;

  const updatedQuests = fresh.quests.map((quest) => {
    if (quest.claimed) return quest;

    let nextProgress = quest.progress;
    switch (quest.kind) {
      case 'solve':
        nextProgress = Math.min(
          quest.target,
          quest.progress + summary.myState.correctCount
        );
        break;
      case 'streak':
        nextProgress = Math.min(
          quest.target,
          Math.max(quest.progress, summary.myState.bestStreak)
        );
        break;
      case 'win':
        if (summary.result === 'win') {
          nextProgress = Math.min(quest.target, quest.progress + 1);
        }
        break;
      case 'accuracy':
        if (summary.accuracy >= 85 && summary.myState.correctCount > 0) {
          nextProgress = Math.min(quest.target, quest.progress + 1);
        }
        break;
      case 'mult-div':
        nextProgress = Math.min(quest.target, quest.progress + multDivCorrect);
        break;
      case 'boss':
        if (summary.mode === 'coop-boss') {
          nextProgress = Math.min(quest.target, quest.progress + 1);
        }
        break;
    }

    return nextProgress === quest.progress
      ? quest
      : { ...quest, progress: nextProgress };
  });

  return {
    ...fresh,
    quests: updatedQuests,
  };
}

export function evaluateBadges(profile: TeamProfile): string[] {
  const earned = new Set<string>(profile.badges ?? []);

  if (profile.stats.wins >= 1) {
    earned.add('badge-first-win');
  }
  if (profile.stats.bestQpm >= 20) {
    earned.add('badge-speed-demon');
  }
  if (profile.stats.perfectRaces >= 1) {
    earned.add('badge-perfectionist');
  }
  if (profile.stats.longestStreak >= 10) {
    earned.add('badge-unstoppable');
  }
  if (profile.stats.totalCorrect >= 100) {
    earned.add('badge-century');
  }

  const starterSet = new Set(DEFAULT_UNLOCKED_IDS);
  const extraUnlockedCount = profile.unlockedIds.filter(
    (id) => !starterSet.has(id)
  ).length;
  if (extraUnlockedCount >= 6) {
    earned.add('badge-shopaholic');
  }

  if (profile.stats.bossWins >= 1) {
    earned.add('badge-boss-buster');
  }

  const radioIds = new Set(
    SHOP_ITEMS.filter(
      (item) => item.category === 'radio' && item.id !== 'radio-off'
    ).map((item) => item.id)
  );
  const unlockedRadioCount = profile.unlockedIds.filter((id) =>
    radioIds.has(id)
  ).length;
  if (unlockedRadioCount >= 3) {
    earned.add('badge-dj');
  }

  return TROPHY_BADGES.map((b) => b.id).filter((id) => earned.has(id));
}
