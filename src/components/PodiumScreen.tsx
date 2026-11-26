import React, { useEffect } from 'react';
import {
  CheckCircle2,
  Coins,
  Flame,
  Home,
  RotateCcw,
  ShoppingBag,
  Trophy,
  Zap,
} from 'lucide-react';
import { HeadToHeadRecord, RaceSummary } from '../types';
import { getTeamMeta } from '../data/shop';
import {
  getCelebrationInfo,
  runCelebrationAnimation,
} from '../engine/celebrations';

interface PodiumScreenProps {
  summary: RaceSummary;
  headToHead: HeadToHeadRecord;
  totalCoins: number;
  rematchStatus: string | null;
  onRematch: () => void;
  onOpenGarage: () => void;
  onGoHome: () => void;
}

export const PodiumScreen: React.FC<PodiumScreenProps> = ({
  summary,
  headToHead,
  totalCoins,
  rematchStatus,
  onRematch,
  onOpenGarage,
  onGoHome,
}) => {
  const winnerTeam =
    summary.result === 'win'
      ? summary.myTeam
      : summary.result === 'loss'
      ? summary.opponentTeam
      : summary.myTeam;
  const winnerMeta = getTeamMeta(winnerTeam);

  const celebrationId =
    summary.result === 'loss'
      ? summary.opponentState.loadout.celebrationId || 'cel-confetti'
      : summary.myState.loadout.celebrationId || 'cel-confetti';
  const celInfo = getCelebrationInfo(celebrationId);

  useEffect(() => {
    return runCelebrationAnimation(celebrationId, winnerTeam);
  }, [celebrationId, winnerTeam]);

  const titleText =
    summary.result === 'win'
      ? `${winnerMeta.name} WINS! 🏆`
      : summary.result === 'tie'
      ? `PHOTO FINISH TIE! 🤝`
      : `${winnerMeta.name} Took 1st Place!`;

  return (
    <div className="screen podium-screen">
      {/* Winner Hero with Equipped Victory Celebration */}
      <div
        className={`podium-hero podium-hero--${winnerTeam} ${
          summary.result !== 'loss' ? celInfo.heroClass : ''
        }`}
      >
        <img
          src={winnerMeta.portrait}
          alt={winnerMeta.name}
          className={`podium-avatar ${
            summary.result === 'win' ? 'podium-avatar--dance' : ''
          }`}
        />
        <div className="podium-title-wrap">
          <div className="podium-badge">
            <Trophy size={16} /> {celInfo.banner}
          </div>
          <h1>{titleText}</h1>
          <p>
            {summary.result === 'win'
              ? 'Incredible math speed! You zoomed across the finish line!'
              : summary.result === 'tie'
              ? 'What an unbelievable neck-and-neck race!'
              : 'Awesome racing! Every race earns Speed Coins & builds your skills!'}
          </p>
        </div>
      </div>

      {/* Head to Head Banner */}
      <div className="h2h-strip">
        <div className="h2h-side h2h-doggy">
          <span>🐶 Doggy</span>
          <strong>{headToHead.doggyWins}</strong>
        </div>
        <div className="h2h-center">
          <Trophy size={16} />
          <span>SERIES SCORE</span>
        </div>
        <div className="h2h-side h2h-slothy">
          <strong>{headToHead.slothyWins}</strong>
          <span>Slothy 🦥</span>
        </div>
      </div>

      {/* Race Stats & Coin Rewards */}
      <div className="podium-grid">
        <div className="stats-summary-card">
          <h3>Your Race Stats</h3>
          <div className="mini-stats-grid">
            <div className="mini-stat">
              <Zap size={18} />
              <strong>{summary.qpm}</strong>
              <span>Answers / Min</span>
            </div>
            <div className="mini-stat">
              <CheckCircle2 size={18} />
              <strong>{summary.accuracy}%</strong>
              <span>Accuracy</span>
            </div>
            <div className="mini-stat">
              <Flame size={18} />
              <strong>{summary.myState.bestStreak}</strong>
              <span>Best Streak</span>
            </div>
            <div className="mini-stat">
              <Trophy size={18} />
              <strong>{summary.myState.correctCount}</strong>
              <span>Correct</span>
            </div>
          </div>
        </div>

        <div className="coins-reward-card">
          <div className="coins-reward-header">
            <h3>
              <Coins size={20} /> Speed Coins Earned
            </h3>
            <span className="coins-total-badge">+{summary.coins.total} 🪙</span>
          </div>
          <ul className="coin-lines">
            <li>
              <span>Race Finished</span>
              <strong>+{summary.coins.baseCompletion}</strong>
            </li>
            <li>
              <span>Correct Answers ({summary.myState.correctCount} × 3)</span>
              <strong>+{summary.coins.correctBonus}</strong>
            </li>
            {summary.coins.streakBonus > 0 && (
              <li>
                <span>Hot Streak Bonus</span>
                <strong>+{summary.coins.streakBonus}</strong>
              </li>
            )}
            {summary.coins.accuracyBonus > 0 && (
              <li>
                <span>Sharp Accuracy Bonus</span>
                <strong>+{summary.coins.accuracyBonus}</strong>
              </li>
            )}
            <li>
              <span>Podium Reward</span>
              <strong>+{summary.coins.podiumBonus}</strong>
            </li>
            {summary.coins.perkMultiplierBonus > 0 && (
              <li className="coin-line-perk">
                <span>Garage Coin Perk Bonus!</span>
                <strong>+{summary.coins.perkMultiplierBonus}</strong>
              </li>
            )}
          </ul>
          <div className="coins-bank-line">
            Bank Balance: <strong>🪙 {totalCoins} Speed Coins</strong>
          </div>
        </div>
      </div>

      {/* Missed Questions Review */}
      {summary.missedQuestions.length > 0 && (
        <div className="missed-card">
          <h3>📝 Quick Practice Review</h3>
          <p className="missed-hint">
            Here are the tricky ones from this race — you&apos;ll crush them next
            time!
          </p>
          <div className="missed-chips">
            {summary.missedQuestions.slice(0, 8).map((m, i) => (
              <div key={i} className="missed-chip">
                <span className="missed-q">{m.prompt} =</span>
                <strong className="missed-a">{m.correctAnswer}</strong>
                <small className="missed-you">(you picked {m.givenAnswer})</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {rematchStatus && <div className="rematch-status">{rematchStatus}</div>}

      {/* Action Buttons */}
      <div className="podium-actions">
        <button className="arcade-btn arcade-btn--start" onClick={onRematch}>
          <RotateCcw size={22} /> Race Again!
        </button>
        <button className="arcade-btn arcade-btn--gold" onClick={onOpenGarage}>
          <ShoppingBag size={20} /> Garage Shop ({totalCoins} 🪙)
        </button>
        <button className="arcade-btn arcade-btn--neutral" onClick={onGoHome}>
          <Home size={20} /> Home
        </button>
      </div>
    </div>
  );
};
