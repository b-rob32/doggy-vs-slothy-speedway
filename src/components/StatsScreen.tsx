import React, { useState } from 'react';
import {
  ArrowLeft,
  Brain,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Flame,
  Lock,
  Trophy,
  Upload,
  Zap,
} from 'lucide-react';
import { SaveData, SingleOperation, TeamId } from '../types';
import { getTeamMeta } from '../data/shop';
import { exportSaveCode, importSaveCode } from '../engine/storage';
import { TROPHY_BADGES } from '../engine/quests';

interface StatsScreenProps {
  save: SaveData;
  activeTeam: TeamId;
  onSwitchTeam: (team: TeamId) => void;
  onImportSave: (imported: SaveData) => void;
  onBack: () => void;
}

const OP_LABELS: { id: SingleOperation; label: string; color: string }[] = [
  { id: 'addition', label: 'Addition (+)', color: '#3b82f6' },
  { id: 'subtraction', label: 'Subtraction (−)', color: '#8b5cf6' },
  { id: 'multiplication', label: 'Multiplication (×)', color: '#f59e0b' },
  { id: 'division', label: 'Division (÷)', color: '#10b981' },
];

const OP_SYMBOL: Record<string, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

function formatFactKey(factKey: string): string {
  const parts = factKey.split(':');
  if (parts.length === 3) {
    const [op, a, b] = parts;
    const sym = OP_SYMBOL[op] ?? op;
    return `${a} ${sym} ${b}`;
  }
  return factKey;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  save,
  activeTeam,
  onSwitchTeam,
  onImportSave,
  onBack,
}) => {
  const [showTransfer, setShowTransfer] = useState(false);
  const [importText, setImportText] = useState('');
  const [transferMsg, setTransferMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const profile = save.profiles[activeTeam];
  const stats = profile.stats;
  const meta = getTeamMeta(activeTeam, profile.racerName);
  const doggyMeta = getTeamMeta('doggy', save.profiles.doggy.racerName);
  const slothyMeta = getTeamMeta('slothy', save.profiles.slothy.racerName);

  const earnedBadges = profile.badges ?? [];
  const trickyFacts = Object.entries(profile.missedFactCounts ?? {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const winRate =
    stats.totalRaces > 0
      ? Math.round((stats.wins / stats.totalRaces) * 100)
      : 0;
  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
      : 0;

  const handleCopyBackup = () => {
    const code = exportSaveCode(save);
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTransferMsg('Backup code copied! Paste it on another tablet to transfer profiles.');
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    const parsed = importSaveCode(importText);
    if (!parsed) {
      setTransferMsg('Hmm, that backup code did not look valid. Please copy the full code!');
      return;
    }
    onImportSave(parsed);
    setImportText('');
    setTransferMsg('Profiles & Career Stats imported successfully! 🎉');
  };

  return (
    <div className="screen stats-screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} /> Back
        </button>
        <h2 className="screen-title">📊 Career Stats</h2>
        <button
          className="transfer-btn"
          onClick={() => setShowTransfer((s) => !s)}
        >
          <Download size={16} /> Transfer
        </button>
      </div>

      {/* Transfer / Backup Drawer */}
      {showTransfer && (
        <div className="transfer-card">
          <h4>Sync / Backup Profiles Between Devices</h4>
          <p>
            Copy your save code from one tablet and paste it on another to move
            coins, cars, and lifetime stats!
          </p>
          <div className="transfer-actions">
            <button className="shop-btn shop-btn--equip" onClick={handleCopyBackup}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied Backup Code!' : 'Copy My Backup Code'}
            </button>
          </div>
          <div className="transfer-import-row">
            <input
              type="text"
              placeholder="Paste backup code here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <button
              className="shop-btn shop-btn--buy"
              disabled={!importText.trim()}
              onClick={handleImport}
            >
              <Upload size={16} /> Import
            </button>
          </div>
          {transferMsg && <div className="transfer-msg">{transferMsg}</div>}
        </div>
      )}

      {/* Overall Head-to-Head Rivalry */}
      <div className="h2h-strip">
        <div className="h2h-side h2h-doggy">
          <span>🐶 {doggyMeta.shortName}</span>
          <strong>{save.headToHead.doggyWins}</strong>
        </div>
        <div className="h2h-center">
          <Trophy size={16} />
          <span>ALL-TIME RIVALRY</span>
        </div>
        <div className="h2h-side h2h-slothy">
          <strong>{save.headToHead.slothyWins}</strong>
          <span>{slothyMeta.shortName} 🦥</span>
        </div>
      </div>

      {/* Team Switcher */}
      <div className="team-tabs">
        {(['doggy', 'slothy'] as TeamId[]).map((t) => {
          const tm = getTeamMeta(t, save.profiles[t].racerName);
          return (
            <button
              key={t}
              className={`team-tab team-tab--${t} ${
                activeTeam === t ? 'active' : ''
              }`}
              onClick={() => onSwitchTeam(t)}
            >
              {tm.emoji} {tm.name}
            </button>
          );
        })}
      </div>

      {/* Career Overview Cards */}
      <div className="career-grid">
        <div className="career-card">
          <Trophy size={22} className="career-ico career-ico--gold" />
          <strong>{stats.totalRaces}</strong>
          <span>Total Races</span>
          <small>
            {stats.wins}W – {stats.losses}L
            {stats.ties > 0 ? ` – ${stats.ties}T` : ''} ({winRate}%)
          </small>
        </div>

        <div className="career-card">
          <CheckCircle2 size={22} className="career-ico career-ico--green" />
          <strong>{accuracy}%</strong>
          <span>Lifetime Accuracy</span>
          <small>
            {stats.totalCorrect} / {stats.totalQuestions} solved
          </small>
        </div>

        <div className="career-card">
          <Zap size={22} className="career-ico career-ico--blue" />
          <strong>{stats.bestQpm}</strong>
          <span>Best Speed (QPM)</span>
          <small>Answers per minute</small>
        </div>

        <div className="career-card">
          <Flame size={22} className="career-ico career-ico--orange" />
          <strong>{stats.longestStreak}</strong>
          <span>Longest Streak</span>
          <small>Correct in a row</small>
        </div>
      </div>

      {/* Trophy Shelf */}
      <div className="mastery-card trophy-shelf-card">
        <h3>
          <Trophy size={20} style={{ color: '#eab308' }} />
          <span>
            {meta.shortName}&apos;s Trophy Shelf ({earnedBadges.length}/
            {TROPHY_BADGES.length})
          </span>
        </h3>
        <div
          className="trophy-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
            gap: '10px',
          }}
        >
          {TROPHY_BADGES.map((badge) => {
            const unlocked = earnedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`trophy-badge-card ${
                  unlocked ? 'trophy-badge-card--unlocked' : 'trophy-badge-card--locked'
                }`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '4px',
                  padding: '12px 10px',
                  borderRadius: '16px',
                  background: unlocked
                    ? 'linear-gradient(145deg, #fefce8, #fef08a)'
                    : '#f8fafc',
                  border: unlocked ? '2px solid #eab308' : '2px dashed #cbd5e1',
                  boxShadow: unlocked
                    ? '0 4px 14px rgba(234, 179, 8, 0.3)'
                    : 'none',
                  opacity: unlocked ? 1 : 0.62,
                  filter: unlocked ? 'none' : 'grayscale(0.75)',
                }}
              >
                <div
                  style={{
                    fontSize: '1.85rem',
                    lineHeight: 1.1,
                    position: 'relative',
                  }}
                >
                  {badge.emoji}
                </div>
                <strong
                  style={{
                    fontSize: '0.88rem',
                    color: unlocked ? '#854d0e' : '#475569',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {!unlocked && <Lock size={12} />}
                  {badge.name}
                </strong>
                <small
                  style={{
                    fontSize: '0.74rem',
                    color: unlocked ? '#a16207' : '#64748b',
                    lineHeight: 1.25,
                  }}
                >
                  {badge.description}
                </small>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Practice Coach */}
      <div className="mastery-card smart-coach-card">
        <h3>
          <Brain size={20} style={{ color: '#8b5cf6' }} />
          <span>Smart Practice Coach</span>
        </h3>
        {trickyFacts.length === 0 ? (
          <p className="empty-history" style={{ textAlign: 'left', padding: '4px 0' }}>
            🌟 No tricky facts right now for {meta.shortName}! When Smart Practice is
            enabled, any missed math facts automatically show up here and reappear in
            future races until mastered.
          </p>
        ) : (
          <>
            <p className="missed-hint" style={{ marginTop: '-4px' }}>
              Smart Practice is focusing on these {trickyFacts.length} tricky{' '}
              {trickyFacts.length === 1 ? 'fact' : 'facts'} for {meta.shortName}:
            </p>
            <div className="missed-chips">
              {trickyFacts.map(([factKey, count]) => (
                <div
                  key={factKey}
                  className="missed-chip"
                  style={{
                    background: '#f5f3ff',
                    borderColor: '#c4b5fd',
                    color: '#4c1d95',
                  }}
                >
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.05rem' }}>
                    {formatFactKey(factKey)}
                  </span>
                  <span
                    style={{
                      background: '#ede9fe',
                      color: '#6d28d9',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      padding: '2px 7px',
                      borderRadius: '999px',
                    }}
                  >
                    {count}×
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mastery by Math Operation */}
      <div className="mastery-card">
        <h3>{meta.name}&apos;s Math Mastery</h3>
        <div className="mastery-list">
          {OP_LABELS.map((op) => {
            const st = stats.byOperation[op.id];
            const pct =
              st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
            return (
              <div key={op.id} className="mastery-row">
                <div className="mastery-row-head">
                  <span>{op.label}</span>
                  <strong>
                    {st.total > 0
                      ? `${pct}% (${st.correct}/${st.total})`
                      : 'Not raced yet'}
                  </strong>
                </div>
                <div className="mastery-bar-bg">
                  <div
                    className="mastery-bar-fill"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: op.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Race History */}
      <div className="history-card">
        <h3>Recent Races ({profile.recentRaces.length})</h3>
        {profile.recentRaces.length === 0 ? (
          <p className="empty-history">
            No races yet for {meta.name}! Hit the speedway to start tracking
            stats!
          </p>
        ) : (
          <div className="history-list">
            {profile.recentRaces.map((r) => (
              <div key={r.id} className="history-row">
                <span className={`result-pill result-pill--${r.result}`}>
                  {r.result === 'win'
                    ? 'WIN 🏆'
                    : r.result === 'tie'
                    ? 'TIE 🤝'
                    : '2ND 💨'}
                </span>
                <div className="history-info">
                  <strong>
                    {r.operation.toUpperCase()} ({r.difficulty})
                  </strong>
                  <small>
                    {r.mode === 'multiplayer'
                      ? '2-Player'
                      : r.mode === 'coop-boss'
                      ? 'Co-Op Boss'
                      : 'Solo vs CPU'}{' '}
                    • {r.correctCount}✓ {r.wrongCount}✗ • {r.qpm} QPM
                  </small>
                </div>
                <span className="history-coins">+{r.coinsEarned} 🪙</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

